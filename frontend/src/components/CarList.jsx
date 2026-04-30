import CarCard from './CarCard';
import './CarList.css';

export default function CarList({ cars, loading, viewMode = 'grid', emptyMessage = 'No vehicles found' }) {
    if (loading) {
        return (
            <div className="car-list-loading">
                <div className="spinner" />
            </div>
        );
    }

    if (!cars || cars.length === 0) {
        return (
            <div className="car-list-empty">
                <div className="empty-content">
                    <h3>{emptyMessage}</h3>
                    <p>Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`car-list ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
            {cars.map(car => (
                <CarCard key={car._id} car={car} viewMode={viewMode} />
            ))}
        </div>
    );
}
