export function Timeout(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function WaitTick() {
	return new Promise<void>((res) => queueMicrotask(res))
}

const blankFunction = () => {};
export class LazyValue<T> {
	#resolver: (v: T) => void;
	readonly promise: Promise<T>;

	constructor() {
		this.#resolver = blankFunction;
		this.promise = new Promise((res) => this.#resolver = res);
	}

	resolve(v: T) {
		this.#resolver(v);
	}
}


export class Mutex {
	#queue: Array<() => void>;
	#locked: boolean;

	constructor () {
		this.#queue = [];
		this.#locked = true;
	}

	block()   { this.#locked = true;  }
	unblock() { this.#locked = false; }

	wait () {
		if (this.#locked) return new Promise<void>((res) => this.#queue.push(res));
		return;
	}

	wakeOne() {
		const first = this.#queue.shift();
		if (!first) return;

		first();
	}

	wakeAll() {
		const q = [...this.#queue];
		this.#queue.length = 0;
		for (const f of q) f();
	}
}

export class Channel<T> {
	#resolvers: Array<(v: T) => void>;
	#queue: T[];
	#open: boolean;

	constructor() {
		this.#resolvers = [];
		this.#queue = [];
		this.#open = true;
	}

	close () { this.#open = false; }

	// "Write" to the queue
	write(value: T) {
		if (!this.#open) throw new Error("Cannot write to a closed channel");

		const res = this.#resolvers.shift();
		if (res) return res(value);
		this.#queue.push(value);
	}

	read() {
		if (this.#queue.length > 0) return this.#queue.shift();

		if (!this.#open) return undefined;

		return new Promise((resolve) => {
			this.#resolvers.push(resolve);
		});
	}

	async *[Symbol.asyncIterator]() { // for await...of
		while (this.#open) yield await this.read();
	}
}


export class PromiseBatch<T = void> {
	#promise?: Promise<T[]>;
	#resolver?: (v: T[]) => void;

	#concurrent: number;
	#eager: boolean;
	#tasks: Array<() => Promise<T>>;
	#active: number;

	#result: Array<T>;
	#stagger: number;

	#resolve: (val: T) => void;

	constructor (concurrent: number, stagger?: number) {
		this.#concurrent = Math.max(1, concurrent);
		this.#stagger = stagger ? Math.max(0, stagger) : 0;
		this.#eager = stagger === undefined;

		this.#result = new Array<T>();
		this.#active = 0;
		this.#tasks = [];

		this.#resolve = (val: T) => {
			this.#result.push(val);
			this.#active--;
			this.#queue().catch(console.error);
		};
	}

	enqueue(task: () => Promise<T>) {
		this.#tasks.push(task);
		if (this.#eager) this.#queue().catch(console.error);
	}

	async #queue() {
		let multi = false;
		while (this.#tasks.length > 0 && this.#active < this.#concurrent) {
			const task = this.#tasks.shift();
			if (!task) {
				if (!this.#resolver) return;
				this.#resolver(this.#result);
				return;
			}

			if (multi && this.#stagger) await Timeout(this.#stagger);
			else multi = true;

			task().then(this.#resolve).catch(this.#resolve);
			this.#active++;
		}

		if (this.#tasks.length === 0 && this.#active === 0) {
			if (!this.#resolver) return;
			this.#resolver(this.#result);
			return;
		}
	}

	wait(): Promise<T[]> {
		this.#promise ||= new Promise<T[]>((res) => { this.#resolver = res; });
		this.#queue().catch(console.error); // ensure task are scheduled

		return this.#promise;
	}
}

export class TaskThrottle {
	#promise?: Promise<void>;
	#resolver?: () => void;

	#concurrent: number;
	#eager: boolean;
	#tasks: Array<() => Promise<void>>;
	#active: number;

	#stagger: number;

	#resolve: () => void;

	constructor (concurrent: number, stagger?: number) {
		this.#concurrent = Math.max(1, concurrent);
		this.#stagger = stagger ? Math.max(0, stagger) : 0;
		this.#eager = stagger === undefined;

		this.#active = 0;
		this.#tasks = [];

		this.#resolve = () => {
			this.#active--;
			this.#queue().catch(console.error);
		};
	}

	enqueue(task: () => Promise<void>) {
		this.#tasks.push(task);
		if (this.#eager) this.#queue().catch(console.error);
	}

	async #queue() {
		let multi = false;
		while (this.#tasks.length > 0 && this.#active < this.#concurrent) {
			const task = this.#tasks.shift();
			if (!task) {
				if (!this.#resolver) return;
				this.#resolver();
				return;
			}

			if (multi && this.#stagger) await Timeout(this.#stagger);
			else multi = true;

			task().then(this.#resolve).catch(this.#resolve);
			this.#active++;
		}

		if (this.#tasks.length === 0 && this.#active === 0) {
			if (!this.#resolver) return;
			this.#resolver();
			return;
		}
	}

	wait(): Promise<void> {
		this.#promise ||= new Promise<void>((res) => { this.#resolver = res; });
		this.#queue().catch(console.error); // ensure task are scheduled

		return this.#promise;
	}
}


// deno-lint-ignore no-explicit-any
export function JobQueue<T extends Array<any> | undefined>(props: T extends Array<any>
	? {
		tasks: T,
		task: (task: T[number], abort?: AbortSignal) => Promise<void>,
		concurrency: number,
		abort?: AbortSignal,
		notify?: (completed: number, total: number) => void
	}
	: {
		tasks?: undefined,
		task: (abort: AbortSignal) => Promise<void>,
		concurrency: number,
		abort: AbortSignal, // Required for infinite mode
		notify?: (completed: number) => void
	}
): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		if (props.tasks && props.tasks.length < 1) return resolve();

		let completed = 0;
		let cursor = 0;
		let active = 0;

		const error = (e: unknown) => {
			console.error(e);
			next();
		}

		// Using conditional lambda construction to reduce runtime ifs
		const notify = props.notify
			? ( props.tasks
				? () => props.notify!(completed, props.tasks.length)
				: () => props.notify!(completed)
			) : undefined;

		const next = props.tasks
			? () => {
				completed++;
				active--; // make self as done
				queue();  // queue more jobs if possible

				if (notify) notify();
				if (active !== 0) return; // other jobs are still running

				if (props.tasks && completed < props.tasks.length) {
					reject(new Error("Not all tasks completed, but no jobs are queued"));
					return;
				}

				// all jobs done
				return resolve();
			}
			: () => {
				completed++;
				active--; // make self as done
				queue();  // queue more jobs if possible

				if (notify) notify();
				if (active !== 0) return; // other jobs are still running

				// all jobs done
				return resolve();
			};

		const queue = props.tasks
			? () => {
				if (props.abort?.aborted) return;

				while (active < props.concurrency) {
					if (cursor >= props.tasks.length) break;

					const val = props.tasks[cursor];
					props.task(val, props.abort).then(next).catch(error);
					cursor++;
					active++;
				}
			}
			: () => {
				if (props.abort?.aborted) return;

				while (active < props.concurrency) {
					props.task(props.abort).then(next).catch(error);
					cursor++;
					active++;
				}
			}

		queue();
	});
}
