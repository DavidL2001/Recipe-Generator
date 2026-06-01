import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="home-page">
      <h1>🍳 Lindströms Recept-Generator</h1>
      <button>
        <h1>
        <Link to="/register">
            Börja med att skapa ett konto!
          </Link>
          </h1>
      </button>
    </div>
  );
};

export default HomePage;
