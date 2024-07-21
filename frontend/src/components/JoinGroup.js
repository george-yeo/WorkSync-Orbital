import { useState } from "react";
import Modal from 'react-modal';
import { useAuthContext } from "../hooks/useAuthContext";
import { useGroupContext } from "../hooks/useGroupContext";

const JoinGroup = () => {
    const { user } = useAuthContext();
    const { groups, dispatch } = useGroupContext();
    const [isSearchGroupModalOpen, setIsSearchGroupModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    //const [searchResults, setSearchResults] = useState([]);
    const [requestStatus, setRequestStatus] = useState('');

    // Handle Search Group Button Click
    const handleSearchGroupClick = () => {
        setIsSearchGroupModalOpen(true);
        setSearchQuery(null)
        //setSearchResults([])
        setRequestStatus(null)
    };

    // Function to handle the search request
    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        
        if (!searchQuery || searchQuery == '') {
            dispatch({ type: 'SET_SEARCH_RESULTS', payload: null });
            return;
        }

        try {
            const response = await fetch(`/api/group/search/${searchQuery}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            const json = await response.json();

            if (response.ok) {
                dispatch({ type: 'SET_SEARCH_RESULTS', payload: json });
            } else {
                console.error("Error searching groups:", json.message);
            }
        } catch (error) {
            console.error("Failed to search groups:", error);
        }
    };

    // // Function to handle request to join a group
    // const handleRequestJoin = async (groupId) => {
    //     if (!user) return;

    //     try {
    //         const response = await fetch(`/api/group/join/${groupId}`, {
    //             method: 'PATCH',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${user.token}`
    //             },
    //             body: JSON.stringify({ user_id: user._id })
    //         });

    //         const json = await response.json();

    //         if (response.ok) {
    //             setRequestStatus({ success: true, message: "Request to join sent successfully!" });
    //             // Optionally, clear search results
    //             setSearchResults([]);
    //         } else {
    //             setRequestStatus({ success: false, message: json.error });
    //         }
    //     } catch (error) {
    //         console.error("Failed to send request to join group:", error);
    //         setRequestStatus({ success: false, message: error.message });
    //     }
    // };

    return (
        <div className="chat-search">
            <form onSubmit={handleSearchSubmit} onBlur={handleSearchSubmit}>
                <input
                    type="text"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    value={searchQuery}
                />
                <button className="material-symbols-outlined search">search</button>
            </form>
        </div>
    )

    // return (
    //     <div>
    //         {/* Button to open the search modal */}
    //         <button className="search-group-btn" onClick={handleSearchGroupClick}>Search & Request to Join Group</button>

    //         {/* Search Group Modal */}
    //         <Modal
    //             isOpen={isSearchGroupModalOpen}
    //             onRequestClose={() => setIsSearchGroupModalOpen(false)}
    //             contentLabel="Search Group"
    //             className="searchGroup-popup-form"
    //             ariaHideApp={false}
    //         >
    //             <h2>Search for a Group</h2>
    //             <span className="close-btn" onClick={() => setIsSearchGroupModalOpen(false)}>&times;</span>
    //             <form onSubmit={handleSearchSubmit}>
    //                 <label>
    //                     Group Name:
    //                     <input
    //                         type="text"
    //                         value={searchQuery}
    //                         onChange={(e) => setSearchQuery(e.target.value)}
    //                         required
    //                     />
    //                 </label>
    //                 <div className="modal-buttons">
    //                     <button type="submit">Search</button>
    //                 </div>
    //             </form>

    //             {/* Display search results */}
    //             {searchResults.length > 0 && (
    //                 <div className="search-results">
    //                     <h3>Search Results:</h3>
    //                     <div>
    //                         {searchResults.map(group => (
    //                             <p key={group._id}>
    //                                 {group.name}
    //                                 <button className="join-group-btn" onClick={() => handleRequestJoin(group._id)}>Request</button>
    //                             </p>
    //                         ))}
    //                     </div>
    //                 </div>
    //             )}

    //             {/* Display request status */}
    //             {requestStatus && (
    //                 <p className={requestStatus.success ? "status-success" : "status-error"}>
    //                     {requestStatus.message}
    //                 </p>
    //             )}
    //         </Modal>
    //     </div>
    // );
};

export default JoinGroup;