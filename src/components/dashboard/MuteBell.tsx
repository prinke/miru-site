import { useRef, useState } from 'react';
import { actions } from 'astro:actions';
import { Toggle } from '@/components/ui/toggle';
import { run } from '@/lib/dashboard';

/** Bell on an airing show: pressed means alerts are on for it. */
export function MuteBell({ mediaId, title, muted: initial }: { mediaId: number; title: string; muted: boolean }) {
	const [muted, setMuted] = useState(initial);
	const [saving, setSaving] = useState(false);
	const ref = useRef<HTMLButtonElement>(null);

	async function change(alertsOn: boolean) {
		setSaving(true);
		const ok = await run(() => actions.setMuted({ mediaId, muted: !alertsOn }));
		setSaving(false);
		if (!ok) return;
		setMuted(!alertsOn);
		ref.current?.closest('.show')?.classList.toggle('is-muted', !alertsOn);
	}

	return (
		<Toggle
			ref={ref}
			variant="outline"
			size="icon"
			pressed={!muted}
			onPressedChange={change}
			disabled={saving}
			aria-label={muted ? `Unmute alerts for ${title}` : `Mute alerts for ${title}`}
			title={muted ? 'Muted' : 'Alerts on'}
			className="shrink-0 text-muted-foreground hover:text-muted-foreground disabled:cursor-progress aria-pressed:text-primary aria-pressed:hover:text-primary"
		>
			{muted ? (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M8.7 3A6 6 0 0 1 18 8a21 21 0 0 0 .6 5M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7M10.3 21a1.94 1.94 0 0 0 3.4 0M2 2l20 20" />
				</svg>
			) : (
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
				</svg>
			)}
		</Toggle>
	);
}
