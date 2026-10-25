import { useEffect, useRef, useState } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CONFIRM_EVENT, type ConfirmRequest } from '@/lib/confirm';

/** Mount once per page; opened by `confirmDialog()` from lib/confirm. */
export function ConfirmDialog() {
	const [request, setRequest] = useState<ConfirmRequest | null>(null);
	// Kept separate from `request` so the text stays put while the dialog animates out.
	const [open, setOpen] = useState(false);
	// The dialog isn't opened by a Radix trigger, so focus has to be returned by hand.
	const returnFocus = useRef<HTMLElement | null>(null);

	useEffect(() => {
		function onRequest(event: Event) {
			returnFocus.current = document.activeElement as HTMLElement | null;
			setRequest((event as CustomEvent<ConfirmRequest>).detail);
			setOpen(true);
		}
		window.addEventListener(CONFIRM_EVENT, onRequest);
		document.documentElement.setAttribute('data-confirm-ready', '');
		return () => {
			window.removeEventListener(CONFIRM_EVENT, onRequest);
			document.documentElement.removeAttribute('data-confirm-ready');
		};
	}, []);

	function answer(confirmed: boolean) {
		// Resolving twice is harmless, so closing after the confirm button is fine.
		request?.resolve(confirmed);
		setOpen(false);
	}

	return (
		<AlertDialog open={open} onOpenChange={(open) => !open && answer(false)}>
			<AlertDialogContent
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					returnFocus.current?.focus();
				}}
			>
				<AlertDialogHeader>
					<AlertDialogTitle>{request?.title}</AlertDialogTitle>
					<AlertDialogDescription>{request?.description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel size="sm">Cancel</AlertDialogCancel>
					<AlertDialogAction size="sm" onClick={() => answer(true)}>
						{request?.action}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
