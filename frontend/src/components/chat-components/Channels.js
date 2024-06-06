import { useState } from "react"

// components
import Channel from './Channel';

const Channels = ({ channels, selectChannel }) => {

  return (
    <ul>
      {channels && channels.map(channel => (
        <Channel channel={channel} key={channel._id} selectChannel={selectChannel}/>
      ))}
    </ul>
  )
}

export default Channels