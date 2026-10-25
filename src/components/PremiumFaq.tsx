import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const QUESTIONS = [
	{
		q: 'When can I get Premium?',
		a: "Not yet. Miru is still in development and the premium features are being built. This page shows what's planned, and details may change before launch.",
	},
	{
		q: 'How much will it cost?',
		a: "Prices aren't set yet. They'll be on this page before anything goes on sale.",
	},
	{
		q: 'Does Miru for Servers cover everyone in the server?',
		a: 'Yes. One admin unlocks it and the server features work for every member. Personal extras, like smarter alerts, are part of Miru+.',
	},
	{
		q: 'What does the Supporter tier get me?',
		a: "Supporter is a thank-you tier: a badge, card themes and other cosmetics. It's for people who want to help keep Miru running.",
	},
	{
		q: 'I self-host Miru. Do I get these?',
		a: 'Self-hosted copies include every feature in the public repository. Premium features are only on the hosted bot.',
	},
];

export function PremiumFaq() {
	return (
		<Accordion type="single" collapsible>
			{QUESTIONS.map(({ q, a }) => (
				<AccordionItem key={q} value={q}>
					<AccordionTrigger>{q}</AccordionTrigger>
					<AccordionContent>{a}</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	);
}
