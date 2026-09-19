import React from "react";
import { Search, X, Pin } from "lucide-react";

function SearchBar({
    search,
    setSearch,
    availableTags = [],
    selectedTag,
    setSelectedTag,
    filterPinnedOnly,
    setFilterPinnedOnly
}) {
    return (
        <div className="search-filter-section">
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search notes by title, content, or #tags... (Ctrl+K)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                    <button
                        className="search-clear-btn"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Tag Pills & Quick Filters */}
            <div className="filter-pills-row">
                <button
                    className={`filter-pill ${!selectedTag && !filterPinnedOnly ? "active" : ""}`}
                    onClick={() => {
                        setSelectedTag(null);
                        setFilterPinnedOnly(false);
                    }}
                >
                    All Notes
                </button>

                <button
                    className={`filter-pill pin-filter-pill ${filterPinnedOnly ? "active" : ""}`}
                    onClick={() => setFilterPinnedOnly(!filterPinnedOnly)}
                >
                    <Pin size={13} />
                    <span>Pinned</span>
                </button>

                {availableTags.map((tag) => (
                    <button
                        key={tag}
                        className={`filter-pill ${selectedTag === tag ? "active" : ""}`}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default SearchBar;