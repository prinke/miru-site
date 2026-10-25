import { useState } from 'react';
import { actions } from 'astro:actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { run } from '@/lib/dashboard';

type Mode = 'highlights' | 'everything';

const LABELS: Record<Mode, string> = { highlights: 'Highlights', everything: 'Everything' };

export function FeedModeSelect({ guildId, guildName, mode: initial }: { guildId: string; guildName: string; mode: Mode }) {
	const [mode, setMode] = useState<Mode>(initial);
	const [saving, setSaving] = useState(false);

	async function change(next: string) {
		const previous = mode;
		setMode(next as Mode);
		setSaving(true);
		const ok = await run(() => actions.setFeedMode({ guildId, mode: next as Mode }));
		setSaving(false);
		if (!ok) setMode(previous);
	}

	return (
		<Select value={mode} onValueChange={change} disabled={saving}>
			<SelectTrigger
				aria-label={`Feed mode for ${guildName}`}
				className="bg-card py-1.5 data-[size=default]:h-auto text-[14px] leading-[normal] font-semibold dark:hover:bg-card"
			>
				{/* Explicit label so the server render isn't empty before hydration. */}
				<SelectValue>{LABELS[mode]}</SelectValue>
			</SelectTrigger>
			<SelectContent position="popper" align="end">
				{Object.entries(LABELS).map(([value, label]) => (
					<SelectItem key={value} value={value}>
						{label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
