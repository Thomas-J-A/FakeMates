import './PedrosHerbs.ad.css';

const PedrosHerbs = () => {
  return (
    <div className="ad--pedros">
      <div className="ad--pedros__logo">
        <h1 className="ad--pedros__brandName">Pedro's Herbs</h1>
        <h2 className="ad--pedros__tagline">
          It's <span className="ad--pedros__taglineEmphasis">all</span> medicinal
        </h2>
      </div>
      <button className="ad--pedros__button" type="button">SMOKIN' DEALS</button>
    </div>
  );
};

export default PedrosHerbs;
