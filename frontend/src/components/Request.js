import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";

const Request = () => {
    const { user } = useAuthContext();
    const [error, setError] = useState(null);
    const [joinRequests, setJoinRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionStatus, setActionStatus] = useState(null);

    useEffect(() => {
        const fetchRequests = async () => {
            if(!user){
                return
            }
            try {
                const response = await fetch(`/api/group/request`, {
                    headers: {'Authorization': `Bearer ${user.token}`},
                })
                const json = await response.json()
                if(!response.ok){
                    setError(json.message)
                } else {
                    setJoinRequests(json);
                }
            } catch (error) {
                setError("Failed to fetch join requests")
            } finally {
                setLoading(false)
            }
        }

        fetchRequests()
    }, [user])

    const handleApproveRequest = async (groupId) => {
        try{
            const response = await fetch(`/api/group/accept/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ username: user.username, user_id: user._id })
            })
            if (response.ok) {
                setActionStatus({ success: true, message: 'Request approved' });
            } else {
                const error = await response.json();
                setActionStatus({ success: false, message: `Failed to approve request: ${error.message}` });
            }
        } catch (error) {
            console.error("Error approving request:", error);
            setActionStatus({ success: false, message: `Failed to approve request: ${error.message}` });
        } finally {
            window.location.reload()
        }
    }

    const handleRejectRequest = async (groupId) => {
        try{
            const response = await fetch(`/api/group/reject/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ username: user.username, user_id: user._id })
            })
            if (response.ok) {
                setActionStatus({ success: true, message: 'Request rejected' });
            } else {
                const error = await response.json();
                setActionStatus({ success: false, message: `Failed to approve request: ${error.message}` });
            }
        } catch (error) {
            console.error("Error approving request:", error);
            setActionStatus({ success: false, message: `Failed to approve request: ${error.message}` });
        }
        finally {
            window.location.reload()
        }
    }

    return (
        <div className="requests-column">
            <h3>Join Requests</h3>
            {loading && <p>Loading join requests...</p>}
            {error && <p className="error-message">{error}</p>}
            {joinRequests.length > 0 ? (
                joinRequests.map(request => (
                    <div key={request._id} className="request-item">
                        <p><b>Group:</b> {request.name}</p>
                        <p><b>Members:</b> {request.members.join(", ")}</p>
                        <button className="approve-btn" onClick={() => handleApproveRequest(request._id)}>Approve</button>
                        <button className="reject-btn" onClick={() => handleRejectRequest(request._id)}>Reject</button>
                    </div>
                ))
            ) : (
                !loading && <p>No join requests</p>
            )}
            {actionStatus && (
                <div className={`status-message ${actionStatus.success ? 'success' : 'error'}`}>
                    {actionStatus.message}
                </div>
            )}
        </div>
    )
}

export default Request;