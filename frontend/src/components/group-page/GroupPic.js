import { useState } from "react"
import { useGroup } from "../../hooks/useGroup";

const GroupPic = ( {closePopup} ) => {
    const { uploadPic, error } = useGroup()
    const [image, setImage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault()
        const success = await uploadPic(image)
        if (success){
            closePopup();
            window.location.reload()
        }
    }

    const handleFileUpload = async (e) => {
        setImage(e.target.files[0])
    }

    return (
    <div className="popup-form">
        <div className="popup-content">
            <span className="close-btn" onClick={closePopup}>&times;</span>
            <form className="create" onSubmit={handleSubmit}>
              <h3>Upload Profile Picture</h3>
              <input 
                type="file"
                lable="Image"
                name="myFile"
                id='file-upload'
                accept='.jpeg, .png, .jpg'
                onChange={(e) => handleFileUpload(e)}
                />
                <button type='submit'>Submit</button>
                {error && <div className='error'>{error}</div>} 
            </form>
        </div>
    </div>
    )
}

export default GroupPic
export { GroupPic }