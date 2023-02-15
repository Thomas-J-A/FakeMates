// import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

import MainMenu from './MainMenu/MainMenu';
import Notifications from './Notifications/Notifications';

import './Drawer.css';

const Drawer = ({ type, isOpen, closeDrawer }) => {
  return (
    <div className={`drawer ${ isOpen ? "drawer--open" : "" }`}>
      <div className="drawer__innerWrapper">
        {type === "mainMenu"
          ? <MainMenu isOpen={isOpen} closeDrawer={closeDrawer} />
          : <Notifications isOpen={isOpen} />
        }              
      </div>
      {/* <button
        className="closeDrawer"
        type="button"
        onClick={closeDrawer}
        >
        <FontAwesomeIcon className="closeDrawer__icon" icon={faChevronRight} />
      </button> */}
    </div>
  );
};

export default Drawer;
