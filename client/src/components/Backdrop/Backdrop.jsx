import './Backdrop.css';

const Backdrop = ({ isVisible, closeDrawer }) => {
  return (
    <div
      className={`backdrop ${ isVisible ? "backdrop--visible" : "" }`}
      onClick={closeDrawer}
    />
  );
};

export default Backdrop;
