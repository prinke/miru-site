import { useState } from 'react';
import { actions } from 'astro:actions';
import { Switch } from '@/components/ui/switch';
import { run } from '@/lib/dashboard';

const STATE = {
	on: 'Miru DMs you when a new episode airs. Use the bell to mute a show.',
	off: 'Alerts are off. Turn them on to get a DM when a new episode airs.',
};

export function AlertsSwitch({ enabled: initial, disabled }: { enabled: boolean; disabled: boolean }) {
	const [enabled, setEnabled] = useState(initial);
	const [saving, setSaving] = useState(false);

	async function change(next: boolean) {
		setEnabled(next);
		setSaving(true);
		const ok = await run(() => actions.setAlerts({ enabled: next }));
		setSaving(false);
		if (!ok) {
			setEnabled(!next);
			return;
		}
		// The status line and the DM warning live in the server-rendered panel.
		document.querySelector('#alerts-state')!.textContent = next ? STATE.on : STATE.off;
		document.querySelector('#undeliverable')?.remove();
	}

	return (
		<label className="inline-flex cursor-pointer items-center gap-2.5">
			<span className="text-[14px] font-semibold text-ink-soft">Episode alerts</span>
			<Switch checked={enabled} onCheckedChange={change} disabled={disabled || saving} />
		</label>
	);
}
