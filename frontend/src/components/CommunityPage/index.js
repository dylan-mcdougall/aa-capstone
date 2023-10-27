import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './CommunityPage.css'
import { loadRoom } from '../../store/rooms';
import { deleteCommunity } from '../../store/community';
import CommunityRoomsScroll from '../CommunityRoomsScroll';
import RoomDisplay from '../RoomDisplay';
import CommunityMembersBar from '../CommunityMembersBar';
import { v4 as uuidv4 } from 'uuid';

const wsUrl = process.env.NODE_ENV === 'production' ? 'wss://para-social.onrender.com' : 'ws://localhost:8000';

function CommunityPage({ dataLoaded, displayCommunity, setDisplayCommunity, displayRoom, setDisplayRoom }) {
    const dispatch = useDispatch();
    const sessionUser = useSelector(state => state.session.user);
    const community = useSelector(state => state.community.community);
    const room = useSelector(state => state.room.room);
    const [roomDataLoaded, setRoomDataLoaded] = useState(false);
    const webSocket = useRef(null);
    const [roomMessages, setRoomMessages] = useState([]);
    const [clearMessages, setClearMessages] = useState(false);

    useEffect(() => {
        if (!room) return

        if (webSocket.current) {
            webSocket.current.close()
        }

        const ws = new WebSocket(wsUrl);
        webSocket.current = ws;

        ws.onopen = (e) => {
            console.log(`connected ${e}`);
        }

        ws.onmessage = (e) => {
            const parsedData = JSON.parse(e.data);
            parsedData.tempId = uuidv4();
            return setRoomMessages(roomMessages => [...roomMessages, parsedData]);
        }

        ws.onerror = (e) => {
            console.log(e);
        }

        ws.onclose = (e) => {
            console.log(`connection closed ${e}`);
            return webSocket.current = null;
        }

        return function() {
            if (webSocket.current) {
                webSocket.current.close()
            }
        }
    }, [displayRoom]);

    console.log('Community Page community state: ', community);
    console.log('Community Page room state: ', room);

    // useEffect(() => {
    //     if (!displayCommunity) return
    //     if (!community?.Rooms) return setDisplayRoom(null)
    //     setDisplayRoom(room?.id || community?.Rooms[0]?.id)
    // }, [community, room])

    useEffect(() => {
        if (!displayCommunity) return
        async function fetchRoomData() {
            try {
                await dispatch(loadRoom(displayRoom));
                setRoomDataLoaded(true)
            } catch (error) {
                console.log('Error fetching room data: ', error)
            }
        }
        
        fetchRoomData();

        return () => {
            setRoomDataLoaded(false)
        }
    }, [displayRoom, community, dataLoaded, displayCommunity])

    const handleDelete = (e) => {
        e.preventDefault();
        dispatch(deleteCommunity(community.id));
        setDisplayCommunity(sessionUser?.Communities[0]?.id);
    }

    return (
        <div className='community-page-wrapper'>
            <button onClick={handleDelete}>Delete Community</button>
            {dataLoaded && (
                <div className='community-page-content'>
                    <CommunityRoomsScroll clearMessages={clearMessages} setClearMessages={setClearMessages} webSocket={webSocket} roomDataLoaded={roomDataLoaded} displayRoom={displayRoom} setDisplayRoom={setDisplayRoom} />
                    <RoomDisplay roomMessages={roomMessages} setRoomMessages={setRoomMessages} clearMessages={clearMessages} setClearMessages={setClearMessages} webSocket={webSocket} setDisplayCommunity={setDisplayCommunity} roomDataLoaded={roomDataLoaded} displayRoom={displayRoom} setDisplayRoom={setDisplayRoom} />
                    <CommunityMembersBar />
                </div>
            )}
        </div>
    )
}

export default CommunityPage;
