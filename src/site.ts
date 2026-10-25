// Site-wide values used by the landing page and docs.
// TODO: replace with the hosted bot's application ID once it's public.
export const CLIENT_ID = '1122182674325438524';

export const SITE = {
	name: 'Miru',
	tagline: 'Anime & manga on Discord, powered by AniList',
	source: 'https://github.com/prinke/miru',
	author: { name: 'prinke.dev', href: 'https://prinke.dev' },
};

export const INVITE = {
	// Bare authorize link: Discord lets the user pick server or personal install.
	any: `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}`,
	server: `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=19456&integration_type=0`,
	personal: `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=applications.commands&integration_type=1`,
};
