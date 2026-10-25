import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface SessionUser {
	name: string;
	image?: string | null;
}

/**
 * "Log in" link that turns into the account menu once we know there's a session.
 * The landing page is prerendered, so this runs in the browser. Without a session
 * cookie the request returns null without touching the database. Server-rendered
 * pages already know the user and pass it in, which skips the request.
 */
export function UserMenu({ initialUser }: { initialUser?: SessionUser }) {
	const [user, setUser] = useState<SessionUser | null>(initialUser ?? null);

	useEffect(() => {
		if (initialUser) return;
		fetch('/api/auth/get-session')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => setUser(data?.user ?? null))
			.catch(() => {});
	}, []);

	if (!user) {
		return (
			<a className={buttonVariants({ variant: 'ghost', size: 'nav' })} href="/login/">
				Log in
			</a>
		);
	}

	async function logOut() {
		await fetch('/api/auth/sign-out', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: '{}',
		}).catch(() => {});
		// The dashboard would only bounce a logged-out visitor to the login page.
		if (window.location.pathname.startsWith('/dashboard')) window.location.href = '/';
		else window.location.reload();
	}

	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger
				className={cn(
					buttonVariants({ variant: 'secondary', size: 'inline' }),
					'group gap-2 py-1 pr-2.5 pl-1 text-[15px] text-foreground',
				)}
			>
				<Avatar className="after:hidden">
					{user.image && <AvatarImage src={user.image} alt="" />}
					<AvatarFallback className="bg-pink-soft font-heading text-[16px] font-black text-pink-deep">
						{user.name.charAt(0).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				<span className="max-w-[140px] truncate max-[520px]:hidden">{user.name}</span>
				<HugeiconsIcon
					icon={ArrowDown01Icon}
					strokeWidth={2.5}
					className="size-4 text-muted-foreground transition-transform group-aria-expanded:rotate-180"
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={8}>
				<DropdownMenuItem asChild className="text-foreground no-underline">
					<a href="/dashboard/">Dashboard</a>
				</DropdownMenuItem>
				<DropdownMenuItem className="text-pink-deep focus:text-pink-deep" onSelect={logOut}>
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
