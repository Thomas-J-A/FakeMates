import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import './SearchBar.css';

const SearchBar = ({ isOpen, closeDrawer }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Reset input value when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Reset input value when navigating to a new page
  useEffect(() => {
    setQuery('');
  }, [pathname]);

  const handleChange = (e) => setQuery(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log('Sending query to backend...');
    
    // Reset input value and close drawer (if open) after API call
    // especially if navigating to same page?
    navigate('/search');
  };

  return (
    <form className="searchBar" onSubmit={handleSubmit}>
      <button className="searchBar__submit" type="submit">
        <FontAwesomeIcon className="searchBar__icon" icon={faMagnifyingGlass} />
      </button>
      <input
        className="searchBar__input"
        type="search"
        placeholder="Search FakeMates..."
        aria-label="Search for users"
        value={query}
        onChange={handleChange}
      />
    </form>
  );
};

export default SearchBar;
