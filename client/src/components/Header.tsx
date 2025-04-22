import { Link } from 'wouter';

const Header = () => {
  return (
    <header className="bg-primary-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <i className="ri-code-box-line text-2xl"></i>
            <h1 className="text-xl font-semibold">TestGen</h1>
          </div>
        </Link>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/your-username/testgen"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-sm transition flex items-center"
          >
            <i className="ri-github-fill mr-1"></i>
            GitHub
          </a>
          <a
            href="https://api.x.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/20 rounded px-3 py-1.5 text-sm transition flex items-center"
          >
            <i className="ri-question-line mr-1"></i>
            Help
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
