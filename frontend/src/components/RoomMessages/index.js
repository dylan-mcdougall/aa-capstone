import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './RoomMessages.css';
import { loadRoom } from '../../store/rooms';
import moment from 'moment';
import OpenModalButton from '../OpenModalButton';
import DeleteRoomMessageModal from '../DeleteMessageModal';

function RoomMessages({ displayRoom, roomMessages, setRoomMessages }) {
    const dispatch = useDispatch();
    const sessionUser = useSelector(state => state.session.user);
    const room = useSelector(state => state.room.room);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        if (displayRoom === null || displayRoom === undefined) return
        dispatch(loadRoom(displayRoom));
        setDataLoaded(true)
        if (!room?.Messages?.length) {
            return;
        }
        roomMessages = roomMessages.filter(msg => !msg.tempId);
    }, [displayRoom, roomMessages]);

    return (
        <div className='room-messages-wrapper'>
            {dataLoaded && (
                <ul className='room-messages-ul'>
                    <div>
                        {room?.Messages?.length ? (
                            room.Messages.map((message) => {
                                let usernameClass = 'message-username';
                                if (sessionUser.id === message.user_id) {
                                    usernameClass = usernameClass + ' current'
                                }
                                let validatedPermissions = null;
                                if (sessionUser.id === message.user_id) {
                                    validatedPermissions = (
                                        <>
                                            <OpenModalButton
                                                buttonText={'X'}
                                                modalComponent={() => <DeleteRoomMessageModal roomId={room.id} messageId={message.id} />} />
                                        </>
                                    )
                                }
                                return (
                                    <li className='message-item' key={message.id}>
                                        <div className='message-details'>
                                            <div className='message-details-left'>
                                                <p className={usernameClass}>{message?.User?.username} </p>
                                                <p className='datetime-sent'> Sent {moment(message?.createdAt).format('l LT')}</p>
                                            </div>
                                            {validatedPermissions}
                                        </div>
                                        <div className='message-content'>
                                            {message?.content_message}
                                            {message?.content_src && <img src={message.content_src} alt="Uploaded Content" />}
                                        </div>
                                    </li>
                                )
                            })
                        ) : (
                            roomMessages.map((message, index) => {
                                return (
                                    <li className='message-item ws' key={message.id || index}>
                                        <p className='testing-ws'>
                                            {message?.content_message || message?.data?.content_message}
                                        </p>
                                    </li>
                                )
                            })
                        )}
                    </div>
                </ul>
            )}
        </div>
    );
}

export default RoomMessages;
