import { Search } from 'lucide-react';

const SearchBar = ({ onSearch }: { onSearch: (val: string) => void }) => (
  <div className="search-bar">
    <Search size={18} color="var(--text-muted)" />
    <input
      type="text"
      placeholder="Search records..."
      onChange={(e) => onSearch(e.target.value)}
    />
  </div>
);

export default SearchBar;
