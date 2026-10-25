export interface ConfirmOptions {
	title: string;
	description: string;
	/** Label for the confirm button. */
	action: string;
}

export interface ConfirmRequest extends ConfirmOptions {
	resolve: (confirmed: boolean) => void;
}

export const CONFIRM_EVENT = 'miru:confirm';

/**
 * Asks the user to confirm in the page's <ConfirmDialog> and resolves with their answer.
 * Falls back to the browser's confirm() if the dialog hasn't hydrated yet.
 */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
	if (!document.documentElement.hasAttribute('data-confirm-ready')) {
		return Promise.resolve(window.confirm(`${options.title}\n\n${options.description}`));
	}
	return new Promise((resolve) => {
		window.dispatchEvent(new CustomEvent<ConfirmRequest>(CONFIRM_EVENT, { detail: { ...options, resolve } }));
	});
}
