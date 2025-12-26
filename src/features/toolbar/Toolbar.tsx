import CalculatorWidget from '../calculator/CalculatorWidget';

const Toolbar = () => {
    return (
        <aside className="fixed bottom-4 right-4 z-50">
            <CalculatorWidget />
        </aside>
    );
};

export default Toolbar;
