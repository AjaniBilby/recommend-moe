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