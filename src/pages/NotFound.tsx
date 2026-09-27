import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => (
  <div className="not-found">
    <p className="not-found__code" aria-hidden="true">
      404
    </p>
    <h1 className="not-found__title">This page doesn&apos;t exist</h1>
    <p className="not-found__text">
      Try searching for something else, or head back to your timeline.
    </p>
    <Link to="/" className="not-found__btn">
      Go home
    </Link>
  </div>
);

export default NotFound;
