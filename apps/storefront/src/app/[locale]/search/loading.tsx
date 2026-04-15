import { SearchTermSkeleton } from '@/app/[locale]/search/search-term';
import { SearchResultsSkeleton } from '@/components/shared/skeletons/search-results-skeleton';

export default function SearchLoading() {
    return (
        <div className="container mx-auto px-4 py-8 mt-16">
            <SearchTermSkeleton />
            <SearchResultsSkeleton />
        </div>
    );
}
