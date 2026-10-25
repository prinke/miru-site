import { isActionError } from 'astro:actions';

/** Shows a failed save in the dashboard's error banner. */
export function showError(error: unknown) {
	const box = document.querySelector<HTMLElement>('#action-error')!;
	box.textContent = isActionError(error) && error.message ? error.message : 'That didn’t save. Try again.';
	box.hidden = false;
	box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Runs an action, hiding any earlier error and reporting a new one. Returns whether it saved. */
export async function run(call: () => Promise<{ error?: unknown }>) {
	document.querySelector<HTMLElement>('#action-error')!.hidden = true;
	const { error } = await call();
	if (error) showError(error);
	return !error;
}
