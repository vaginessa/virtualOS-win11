import { useEffect, useRef } from 'react';
import { RemoteDesktopClient } from '../../../core/app';
import { AudioWrapper } from '../../../core/pipeline/sink/audio/wrapper';
import { VideoWrapper } from '../../../core/pipeline/sink/video/wrapper';
import { useAppSelector } from '../../backend/reducers';
import { assign, client } from '../../backend/reducers/remote';
import './remote.scss';

let clipboard = '';
let shouldResetKey = false;
export const Remote = () => {
    const wall = useAppSelector((state) => state.wallpaper);
    const remote = useAppSelector((store) => store.remote);
    const remoteVideo = useRef(null);
    const remoteAudio = useRef(null);

    useEffect(() => {
        if (!remote.active || remote.auth == undefined) return;
        SetupWebRTC();
    }, [remote.active]);

    useEffect(() => {
        const job = remote.fullscreen
            ? document.documentElement.requestFullscreen()
            : document.exitFullscreen();
        job.catch(() => {});
    }, [remote.fullscreen]);

    useEffect(() => {
        const handleState = () => {
            const fullscreen = document.fullscreenElement != null;
            const havingPtrLock = document.pointerLockElement != null;
            if (fullscreen && !havingPtrLock)
                remoteVideo.current.requestPointerLock();
            else if (!fullscreen && havingPtrLock) document.exitPointerLock();
        };

        const UIStateLoop = setInterval(handleState, 100);
        return () => {
            clearInterval(UIStateLoop);
        };
    }, []);

    useEffect(() => {
        const handleClipboard = () => {
            navigator.clipboard
                .readText()
                .then((_clipboard) => {
                    shouldResetKey = true;
                    if (_clipboard == clipboard) return;

                    client?.hid?.SetClipboard(_clipboard);
                    clipboard = _clipboard;
                })
                .catch(() => {
                    if (shouldResetKey) client?.hid?.ResetKeyStuck();

                    shouldResetKey = false;
                });
        };

        const ClipboardLoop = setInterval(handleClipboard, 1000);
        return () => clearInterval(ClipboardLoop);
    }, []);

    const SetupWebRTC = () => {
        const video = new VideoWrapper(remoteVideo.current);
        const audio = new AudioWrapper(remoteAudio.current);
        assign(
            () =>
                new RemoteDesktopClient(
                    video,
                    audio,
                    remote.auth.signaling,
                    remote.auth.webrtc,
                    {
                        scancode: remote.scancode,
                        ads_period: remote.low_ads ? 50 : 300
                    }
                )
        );
    };

    return (
        <div>
            <video
                className="remote"
                ref={remoteVideo}
                style={{ backgroundImage: `url(img/wallpaper/${wall.src})` }}
                autoPlay
                muted
                playsInline
                objectfit={'contain'}
                loop
            ></video>
            <audio
                ref={remoteAudio}
                autoPlay={true}
                playsInline={true}
                controls={false}
                muted={false}
                loop={true}
                style={{ zIndex: -5, opacity: 0 }}
            ></audio>
        </div>
    );
};
