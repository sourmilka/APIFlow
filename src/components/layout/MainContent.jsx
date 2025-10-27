function MainContent({ children }) {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-full mx-auto px-6 py-4 space-y-4 overflow-x-hidden">
        {children}
      </div>
    </main>
  );
}

export default MainContent;
