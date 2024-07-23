import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useGroupContext } from "../hooks/useGroupContext";

import JoinGroup from "./JoinGroup";

const Request = () => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();

    const [error, setError] = useState(null);
    const [inviteRequests, setInviteRequests] = useState([]);
    const [loadingInvite, setLoadingInvite] = useState(true);
    const [actionStatus, setActionStatus] = useState(null);
    const [joinRequests, setJoinRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [requestActionStatus, setrequestActionStatus] = useState(null);
    const [requestError, setRequestError] = useState(null);

    useEffect(() => {
        const fetchInviteRequests = async () => {
            if(!user){
                return
            }
            try {
                const response = await fetch(`/api/group/invite`, {
                    headers: {'Authorization': `Bearer ${user.token}`},
                })
                const json = await response.json()
                if(!response.ok){
                    setError(json.message)
                } else {
                    setInviteRequests(json);
                }
            } catch (error) {
                setError("Failed to fetch invite requests")
            } finally {
                setLoadingInvite(false)
            }
        }

        const fetchJoinRequests = async () => {
            if(!user){
                return
            }
            try {
                const response = await fetch(`/api/group/request`, {
                    headers: {'Authorization': `Bearer ${user.token}`},
                })
                const json = await response.json()
                if(!response.ok){
                    setRequestError(json.message)
                } else {
                    setJoinRequests(json);
                }
            } catch (error) {
                setRequestError("Failed to fetch join requests")
            } finally {
                setLoadingRequests(false)
            }
        }

        fetchInviteRequests()
        //fetchJoinRequests()
    }, [user])

    const handleApproveInvite = async (groupId) => {
        try{
            const response = await fetch(`/api/group/accept/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                //body: JSON.stringify({ user_id: user._id })
            })
            if (response.ok) {
                const updatedGroup = await response.json()
                dispatch({ type: 'CREATE_GROUP', payload: updatedGroup });
                dispatch({ type: 'UPDATE_GROUP', payload: updatedGroup });
                setInviteRequests(inviteRequests.filter(group => group._id != groupId))
                setActionStatus({ success: true, message: 'Invite approved' });
                //window.location.reload()
            } else {
                const error = await response.json();
                setActionStatus({ success: false, message: `Failed to approve invite: ${error.error}` });
            }
        } catch (error) {
            console.error("Error approving invite:", error);
            setActionStatus({ success: false, message: `Failed to approve invite: ${error.message}` });
        }
    }

    const handleRejectInvite = async (groupId) => {
        try{
            const response = await fetch(`/api/group/reject/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                //body: JSON.stringify({ user_id: user._id })
            })
            if (response.ok) {
                setInviteRequests(inviteRequests.filter(group => group._id != groupId))
                setActionStatus({ success: true, message: 'Invite rejected' });
            } else {
                const error = await response.json();
                setActionStatus({ success: false, message: `Failed to reject invite: ${error.error}` });
            }
        } catch (error) {
            console.error("Error approving invite:", error);
            setActionStatus({ success: false, message: `Failed to reject invite: ${error.message}` });
        }
        finally {
            //window.location.reload()
        }
    }

    const handleApproveRequest = async (groupId, requesterId) => {
        try{
            const response = await fetch(`/api/group/acceptUser/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ user_id: requesterId })
            })
            if (response.ok) {
                setrequestActionStatus({ success: true, message: 'Request approved' });
                //window.location.reload()
            } else {
                const error = await response.json();
                setrequestActionStatus({ success: false, message: `Failed to approve Request: ${error.message}` });
            }
        } catch (error) {
            console.error("Error approving Request:", error);
            setrequestActionStatus({ success: false, message: `Failed to approve Request: ${error.message}` });
        }
    }

    const handleRejectRequest = async (groupId, requesterId) => {
        try{
            const response = await fetch(`/api/group/rejectUser/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ user_id: requesterId })
            })
            if (response.ok) {
                setrequestActionStatus({ success: true, message: 'Request approved' });
                //window.location.reload()
            } else {
                const error = await response.json();
                setrequestActionStatus({ success: false, message: `Failed to approve Request: ${error.message}` });
            }
        } catch (error) {
            console.error("Error approving Request:", error);
            setrequestActionStatus({ success: false, message: `Failed to approve Request: ${error.message}` });
        }
    }

    return (
        <div className="requests-column">
            {/* <JoinGroup/> */}
            <div>
                <h2>Invite Requests</h2>
                {loadingInvite && <p>Loading invite requests...</p>}
                {error && <p className="error-message">{error}</p>}
                {inviteRequests.length > 0 ? (
                    inviteRequests.map(request => (
                        <div key={request._id} className="request-item">
                            <p><h3>{request.createdByID.username} invited you to join {request.name} </h3></p>
                            {/* <p><b>Members:</b> {request.membersID.map(member => member.username).join(', ')}</p> */}
                            <button className="approve-btn" onClick={() => handleApproveInvite(request._id)}>Join</button>
                            <button className="reject-btn" onClick={() => handleRejectInvite(request._id)}>Reject</button>
                        </div>
                    ))
                ) : (
                    !loadingInvite && <p>No invite requests</p>
                )}
                {actionStatus && actionStatus.message && (
                    <div className={`status-message ${actionStatus.success ? 'success' : 'error'}`}>
                        {actionStatus.message}
                    </div>
                )}
            </div>
            {/* <div>
                <h2>Join Requests</h2>
                {loadingRequests && <p>Loading invite requests...</p>}
                {requestError && <p className="error-message">{error}</p>}
                {joinRequests.length > 0 ? (
                    joinRequests.map(request => (
                        <div key={request._id} className="group-request">
                            <p><h3>Users requested to join {request.name} </h3></p>
                            {request.requestID.length > 0 ? (
                                request.requestID.map(requester => (
                                    <div key={requester._id} className="request-item">
                                        <p><b>Requested By:</b> {requester.username}</p>
                                        <button className="approve-btn" onClick={() => handleApproveRequest(request._id, requester._id)}>Approve</button>
                                        <button className="reject-btn" onClick={() => handleRejectRequest(request._id, requester._id)}>Reject</button>
                                    </div>
                                ))
                            ) : (
                                <p>No requests</p>
                            )}
                        </div>
                    ))
                ) : (
                    !loadingRequests && <p>No join requests</p>
                )}
            </div> */}
        </div>
    )
}

export default Request;