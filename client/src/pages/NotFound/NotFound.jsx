import { useNavigate } from 'react-router-dom';

import './NotFound.css';
import errorDog from '../../../public/images/error-dog.png';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notFound">
      <img className="notFound__image" src={errorDog} alt="Light brown dog looking sheepish and trying to sneak away" />
      <div className="notFound__titleGroup">
        <h1 className="notFound__title">Grave Error</h1>
        <h2 className="notFound__subtitle">Oh dear, this isn't good...</h2>
      </div>
      <button
        className="notFound__button"
        type="button"
        onClick={() => navigate('/timeline', { replace: true })}
      >
        SOMEWHERE SAFE
      </button>
    </div>
  );
};

export default NotFound;
