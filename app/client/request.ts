// deno-lint-ignore-file no-explicit-any
let activeRequests = 0;
const updateLoadingAttribute = () => {
	if (activeRequests > 0) document.body.setAttribute('data-loading', 'true');
	else document.body.removeAttribute('data-loading');
};

const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.open = function (...args: any[]) {
	this.addEventListener('loadstart', () => {
		activeRequests++;
		updateLoadingAttribute();
	});

	this.addEventListener('loadend', () => {
		activeRequests--;
		updateLoadingAttribute();
	});

	originalXHROpen.apply(this, args as any);
};
XMLHttpRequest.prototype.send = function (...args) {
	originalXHRSend.apply(this, args as any);
};

// Override fetch
const originalFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
	activeRequests++;
	updateLoadingAttribute();

	try {
		const response = await originalFetch(...args);
		return response;
	} finally {
		activeRequests--;
		updateLoadingAttribute();
	}
};