import { FiStar } from 'react-icons/fi';

export default function StarRating({ rating = 0, size = 14 }) {
    return (
        <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(i => (
                <FiStar
                    key={i}
                    size={size}
                    fill={i <= Math.round(rating) ? '#f4a261' : 'none'}
                    color={i <= Math.round(rating) ? '#f4a261' : '#555'}
                />
            ))}
        </div>
    );
}
