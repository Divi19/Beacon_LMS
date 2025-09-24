const mockNavigate = jest.fn();
//Mock up for react-router-dom for test cases

module.exports = {
  NavLink: ({ children }) => <div>{children}</div>,
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }) => <div>{children}</div>,
  __esModule: true,
};