self.addEventListener('install', event => {
	console.info('Service worker installed');
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
	console.info('Service worker activated');
	event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
	if (!event.data) return;

	const data = event.data.json();

	const job = data.target
		? self.registration.showNotification(data.title, {
			body: data.body,
			icon: "/android-chrome-512x512.png",
			data: { url: `/entity/${data.target.kind}/${data.target.id}` },
			tag: `${data.target.kind}-${data.target.id}`
		})
		: self.registration.showNotification(data.title, {
			body: data.body,
			icon: "/android-chrome-512x512.png"
		})

	event.waitUntil(job);
});


self.addEventListener("notificationclick", (evt) => {
	const event = evt;
	const clickedNotification = event.notification;
	clickedNotification.close();

	const data = event.notification.data;
	if (!data) return;

	const target = new URL(self.origin + event.notification.data.url);
	event.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then( windowClients => {
		// Check if there is already a window/tab open with the target URL
		for (let i = 0; i < windowClients.length; i++) {
			const client = windowClients[i];
			const clientUrl = new URL(client.url);

			if (clientUrl.pathname === target.pathname && 'focus' in client) {
				client.focus();
				client.navigate(target);
				return;
			}
		}

		if (self.clients.openWindow) self.clients.openWindow(target);
	}))
});

async function SubscribePushNotifications(device) {
	console.info("Subscribing to push notifications...");
	const req = await fetch("/event/notification/subscribe");
	const applicationServerKey = await req.json();

	const subscription = await self.registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey,
	});

	const headers = new Headers();
	headers.set("device", device);

	await fetch("/event/notification/subscribe", {
		method: "POST",
		headers,
		body: JSON.stringify(subscription.toJSON()),
	});
}

self.addEventListener('message', (event) => {
	switch (event.data.type) {
		case "subscribe-push-notification": return SubscribePushNotifications(event.data.message);
		case "keepalive": return;
		default: console.error(`Unknown message ${event.data.type}`);
	}
});



// vite complains if the client entry doesn't have a default export
export default {};