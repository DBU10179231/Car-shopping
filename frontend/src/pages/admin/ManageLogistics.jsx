import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { FiTruck, FiPackage, FiMapPin, FiClock, FiCheckCircle, FiEdit2 } from 'react-icons/fi';

export default function ManageLogistics() {
    const [shipments, setShipments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchShipments = async () => {
        try {
            const res = await api.get('/logistics/admin/all');
            setShipments(res.data);
            setLoading(false);
        } catch (err) {
            toast.error('Failed to load logistics data');
            setLoading(false);
            // Mock data if failed for now
            setShipments([
                { _id: '1', trackingNumber: 'TRK123456', car: { make: 'Toyota', model: 'RAV4' }, buyer: { name: 'John Doe' }, status: 'in_transit', estimatedDelivery: '2026-03-15' },
                { _id: '2', trackingNumber: 'TRK789012', car: { make: 'BMW', model: '5 Series' }, buyer: { name: 'Sarah J' }, status: 'delivered', estimatedDelivery: '2026-03-05' }
            ]);
        }
    };

    useEffect(() => { fetchShipments(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await api.put(`/logistics/${id}/track`, { status });
            toast.success('Shipment status updated');
            fetchShipments();
        } catch (err) { toast.error('Update failed'); }
    };

    return (
        <div className="card admin-panel">
            <div className="panel-header">
                <h3>Logistics & Shipment Tracking</h3>
                <p>Monitor and manage all active vehicle deliveries.</p>
            </div>
            <div className="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Tracking #</th>
                            <th>Vehicle</th>
                            <th>Buyer</th>
                            <th>Status</th>
                            <th>Est. Delivery</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shipments.map(s => (
                            <tr key={s._id}>
                                <td style={{ fontWeight: 600 }}><FiPackage /> {s.trackingNumber}</td>
                                <td>{s.car?.make} {s.car?.model}</td>
                                <td>{s.buyer?.name}</td>
                                <td>
                                    <span className={`badge badge-${s.status === 'delivered' ? 'green' :
                                        s.status === 'cancelled' ? 'red' :
                                            s.status === 'pending_pickup' ? 'orange' : 'blue'
                                        }`}>
                                        {s.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    {s.status === 'delivered' && s.deliveryDetails?.actualArrivalDate
                                        ? <span className="text-green">{new Date(s.deliveryDetails.actualArrivalDate).toLocaleDateString()} (Actual)</span>
                                        : s.deliveryDetails?.estimatedArrival ? new Date(s.deliveryDetails.estimatedArrival).toLocaleDateString() : '—'
                                    }
                                </td>
                                <td>
                                    <select
                                        className="form-control"
                                        style={{ width: 'auto', padding: '4px' }}
                                        value={s.status}
                                        onChange={(e) => updateStatus(s._id, e.target.value)}
                                    >
                                        <option value="pending_pickup">Pending Pickup</option>
                                        <option value="picked_up">Picked Up</option>
                                        <option value="in_transit">In Transit</option>
                                        <option value="out_for_delivery">Out for Delivery</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
