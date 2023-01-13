import { useState, useEffect, useRef } from 'react';

import './AdsCarousel.css';

const DELAY = 5000;

const AdsCarousel = ({ ads, context }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isAutoplay) {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }, DELAY);
    }

    return () => clearTimeout(timerRef.current);
  }, [isAutoplay, currentIndex]);

  return (
    <div
      // className="adsCarousel"
      className={`adsCarousel adsCarousel--${ context }`}
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      {ads.map((ad, index) => (
        <div
          className="adsCarousel__slide"
          key={index}
          style={{ transform: `translateX(calc(-${currentIndex * 100}% - .1px))` }} /* Account for rounding error when translating with percentages */
        >
          {ad}
        </div>
      ))}
    </div>
  );
};

export default AdsCarousel;
