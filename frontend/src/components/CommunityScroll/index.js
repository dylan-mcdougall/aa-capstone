import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CreateCommunityModal from '../CreateCommunityModal';
import OpenModalButton from '../OpenModalButton';
import './CommunityScroll.css'
import { loadCommunity } from '../../store/community';
import UpdateCommunityModal from '../UpdateCommunityModal';
import { FaPenSquare } from 'react-icons/fa';
import DeleteCommunityModal from '../DeleteCommunityModal';

function CommunityScrollBar({ setDisplayRoom, displayCommunity, setDisplayCommunity }) {
    const dispatch = useDispatch();
    const sessionUser = useSelector(state => state.session.user);
    const community = useSelector(state => state.community.community);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        if (!displayCommunity) return
        dispatch(loadCommunity(displayCommunity))
        setDataLoaded(true)
    }, [displayCommunity]);

    const handleClick = async (communityId) => {
        setDisplayCommunity(communityId)
    }
    
    return (
        <div className='community-bar-wrapper'>
            <ul className='community-bar-ul'>
            {dataLoaded && (
                sessionUser?.Communities?.map((community) => {
                    return (
                    <li className='community-item' onClick={() => handleClick(community.id)} key={community.id}>
                        {community.name}
                        <OpenModalButton
                        buttonText={<FaPenSquare />}
                        modalComponent={() => <UpdateCommunityModal communityId={community.id} />} />
                        <OpenModalButton
                        buttonText={'X'}
                        modalComponent={() => <DeleteCommunityModal setDisplayCommunity={setDisplayCommunity} />} />
                    </li>
                    )
                })
            )}
            </ul>
            <OpenModalButton
                buttonText={'+'}
                modalComponent={() => <CreateCommunityModal  />} />
        </div>
    )
}

export default CommunityScrollBar;
