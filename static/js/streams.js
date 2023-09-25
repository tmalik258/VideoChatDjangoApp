const APP_ID = "fd1a7fdf4d644182bfad617270e4df55";
const CHANNEL = sessionStorage.getItem('room');
const TOKEN = sessionStorage.getItem("TOKEN");
let UID = Number( sessionStorage.getItem( "UID" ) );

const NAME = sessionStorage.getItem('username');
    
const client = AgoraRTC.createClient( { mode: 'rtc', codec: 'vp8' } );

let localTracks = [];
let remoteUsers = {};

const joinAndDisplayLocalStream = async () =>
{
    document.getElementById( 'room-name' ).innerText = CHANNEL;

    client.on( 'user-published', handleUserJoined );
    client.on( 'user-left', handleUserLeft );

    try {
        UID = await client.join( APP_ID, CHANNEL, TOKEN, UID );
    } catch (error) {
        console.error( error );
        window.open( '/', '_self' );
    }

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    const member = await createMember();

    let player = `<div class="video-container" id="user-container-${ UID }">
                    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                    <div class="video-player" id="user-${ UID }"></div>
                </div>`;
    document.getElementById( "video-streams" ).insertAdjacentHTML( 'beforeend', player );

    localTracks[1].play( `user-${ UID }` );

    await client.publish( [localTracks[0], localTracks[ 1 ] ]);
};

const handleUserJoined = async (user, mediaType) =>
{
    remoteUsers[ user.uid ] = user
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let player = document.getElementById( `user-container-${ user.uid }` );

        if ( player != null )
        {
            player.remove();
        }

        const member = await getMember(user);


        player = `<div class="video-container" id="user-container-${user.uid}">
                    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                    <div class="video-player" id="user-${user.uid}"></div>
                </div>`;
        document.getElementById( "video-streams" ).insertAdjacentHTML( "beforeend", player );
        user.videoTrack.play( `user-${ user.uid }` );
    }

    if ( mediaType === 'audio' )
    {
        user.audioTrack.play();
    }
}

const handleUserLeft = async ( user ) =>
{
    delete remoteUsers[ user.uid ];

    document.getElementById(`user-container-${user.uid}`).remove()
}

const leaveAndRemoveLocalStream = async () =>
{
    for (let i = 0; i < localTracks.length; i++) {
        const element = localTracks[i];
        element.stop()
        element.close()
    }

    await client.leave();
    deleteMember();
    window.open('/', '_self')
}

const toggleCamera = async (e) =>
{
    if (localTracks[1].muted) {
        await localTracks[ 1 ].setMuted( false );
        e.target.style.backgroundColor = '#fff';
    }
    else
    {
        await localTracks[ 1 ].setMuted( true );
        e.target.style.backgroundColor = "rgba(206, 6, 6, 0.726)";

    }
}

const toggleMic = async (e) =>
{
    if (localTracks[0].muted) {
        await localTracks[ 0 ].setMuted( false );
        e.target.style.backgroundColor = '#fff';
    }
    else
    {
        await localTracks[ 0 ].setMuted( true );
        e.target.style.backgroundColor = "rgba(206, 6, 6, 0.726)";

    }
}

const createMember = async () =>
{
    const response = await fetch( '/create_member/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'name': NAME, 'room_name': CHANNEL, 'UID': UID})
    } )
    
    const member = await response.json()
    return member
}

const deleteMember = async () =>
{
    const response = await fetch( '/delete_member/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({'name': NAME, 'room_name': CHANNEL, 'UID': UID})
    } )
    
    const member = await response.json()
    return member
}

const getMember = async (user) =>
{
    const response = await fetch( `/get_member/?UID=${ user.uid }&room_name=${ CHANNEL }` );
    const member = await response.json();
    return member;
}

window.addEventListener( 'beforeunload', deleteMember );

joinAndDisplayLocalStream();

document.getElementById( 'leave-btn' ).addEventListener( 'click', leaveAndRemoveLocalStream );
document.getElementById( 'camera-btn' ).addEventListener( 'click', toggleCamera );
document.getElementById( 'mic-btn' ).addEventListener( 'click', toggleMic );