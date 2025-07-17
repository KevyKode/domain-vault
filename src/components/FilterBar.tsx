import React from 'react'
import { Search, Filter } from 'lucide-react'

interface FilterBarProps {
  onSearch: (term: string) => void
  onCategoryChange: (category: string) => void
  onPriceRangeChange: (range: [number, number]) => void
  searchTerm: string
  selectedCategory: string
  priceRange: [number, number]
}

export default function FilterBar({
  onSearch,
  onCategoryChange,
  onPriceRangeChange,
  searchTerm,
  selectedCategory,
  priceRange
}: FilterBarProps) {
  const categories = [
    'Technology',
    'E-commerce',
    'Health',
    'Finance',
    'Education',
    'Entertainment',
    'Business',
    'Travel'
  ]

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              <Filter className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Max Price:</span>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value)])}
                className="w-20"
              />
              <span className="text-sm text-gray-600">${priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}