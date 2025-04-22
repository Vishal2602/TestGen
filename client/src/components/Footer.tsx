const Footer = () => {
  return (
    <footer className="bg-neutral-100 py-4 border-t border-neutral-200">
      <div className="container mx-auto px-4 text-center text-sm text-neutral-500">
        <p>
          TestGen - Powered by Grok 3 API •{" "}
          <a href="#" className="text-primary-500 hover:text-primary-600">
            Documentation
          </a>{" "}
          •{" "}
          <a href="#" className="text-primary-500 hover:text-primary-600">
            Privacy Policy
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
