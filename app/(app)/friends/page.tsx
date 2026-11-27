"use client";

import { FriendsView } from "@/components/communities/friends-panel";
import { PageHero } from "@/components/page-hero";
import { useI18n } from "@/lib/i18n/client";

export default function FriendsPage() {
  const { dict } = useI18n();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:pt-8">
      <PageHero title={dict.friends.title} subtitle={dict.friends.pageSubtitle} />
      <div className="mt-6">
        <FriendsView />
      </div>
    </div>
  );
}
