import React, { useState, useRef, useCallback, useEffect, use, useMemo } from "react";
import Image, { StaticImageData } from "next/image";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/utils/getCroppedImg"; // Implement this function
import { CameraIcon } from "@/utils/svgIcons";
import Modal from "react-modal";
import instructionimg from "@/assets/images/instruction.png";
import useSWR from "swr";
import { getAvatars } from "@/services/user-service";
import { getImageUrlOfS3 } from "@/utils";
import ReactLoading from 'react-loading';


export interface AvatarSelectionProps {
  setAvatarId: (id: string | null) => void;
  setMyOwnImage: React.Dispatch<React.SetStateAction<File | null>>;
  myOwnImage: File | null;
  avatarId: string | null;
}

const AvatarSelection: React.FC<AvatarSelectionProps> = ({ setAvatarId, setMyOwnImage, myOwnImage, avatarId }) => {
  const { data, isLoading } = useSWR(`/user/avatars`, getAvatars, { revalidateOnFocus: false });
  const avatars = useMemo(() => data?.data?.data || [], [data])
  const [selectedAvatar, setSelectedAvatar] = useState<any>()

  useEffect(() => {
    avatars[0] && setSelectedAvatar(avatars[0]?.avatarUrl)
    setAvatarId(avatars[0]?.avatarUrl)
  }, [avatars])

  const [clickAvatar, setClickAvatar] = useState<string | null>(null);
  const [openInstruction, setOpenInstruction] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleAvatarClick = (avatar: any) => {
    setSelectedAvatar(avatar);
    setAvatarId(avatar)
    setMyOwnImage(null)
    setClickAvatar(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFilename(file.name); // Save the original filename
      const reader = new FileReader();
      reader.onloadend = () => {
        setClickAvatar(reader.result as string);
        setIsCropping(true); // Start cropping
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    setOpenInstruction(false);
    setIsCameraOpen(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((error) => {
            console.error("Error playing the video stream:", error);
          });
        }
      })
      .catch((err) => {
        console.error("Error accessing the camera: ", err);
        alert("Could not access the camera. Please allow camera access.");
      });
  };

  const handleTakePicture = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        const imageUrl = canvasRef.current.toDataURL("image/png");
        setClickAvatar(imageUrl);
        setIsCameraOpen(false);
        setIsCropping(true); // Start cropping
        if (videoRef.current.srcObject) {
          (videoRef.current.srcObject as MediaStream)
            .getTracks()
            .forEach((track) => track.stop());
        }
      }
    }
  };

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  )

  const handleCropSave = async () => {
    if (clickAvatar && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(clickAvatar, croppedAreaPixels);
      setClickAvatar(croppedImage);
      setIsCropping(false);

      // Convert the cropped image data URL to a File object using the uploaded filename
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], uploadedFilename || "custom-avatar.png", { type: "image/png" });

      setMyOwnImage(file); // Set custom image as File
      setAvatarId(null); // Clear avatar ID
    }
  };

  const handleInstructionModal = () => {
    setOpenInstruction(true);
  };

  const closeInstructionModal = () => {
    setOpenInstruction(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  }

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        contentRef.current.style.maxHeight = contentRef.current.scrollHeight + "px";
        contentRef.current.style.opacity = "1";
      } else {
        contentRef.current.style.maxHeight = "0px";
        contentRef.current.style.opacity = "0";
      }
    }
  }, [isOpen])


  return (
    <div className="bg-white rounded-lg p-[15px] md:p-[30px] shadow-[0_0_40px_0_rgba(235,130,60,0.06)]">
      <h2 className={`section-title dropdown-title ${isOpen ? 'active' : ''}`} onClick={toggleOpen}>
        Avatar
      </h2>
      <div ref={contentRef} className={`text-selecion overflow-hidden transition-[max-height] duration-500 ease-in-out`} style={{ maxHeight: isOpen ? contentRef.current?.scrollHeight : 0, opacity: isOpen ? 1 : 0 }}>
        <div className="mt-5 flex md:flex-row flex-col gap-y-5 lg:items-center">
          <div className="lg:w-1/2 md:w-[45%] image-section ">
            <h3 className="text-[#6B6B6B] text-sm mb-2">Choose a pre-made</h3>
            <div className="flex lg:flex-row flex-col gap-[21px]">
              <div className={`${isLoading ? '' : 'border'} border-[#E87223] rounded-[5px] w-[169px]`}>
                {isLoading ? <ReactLoading type={'bars'} color={'#e87223'} height={'40px'} width={'40px'} /> : avatars[0] && <Image unoptimized src={getImageUrlOfS3(selectedAvatar)} alt="Selected Avatar" width={200} height={200} className="selected h-full w-full object-contain rounded-[5px]" />}
              </div>
              <div className="grid grid-cols-4 gap-[10px]">
                {isLoading ? <ReactLoading type={'bars'} color={'#e87223'} height={'40px'} width={'40px'} /> : avatars.map((avatar: any, index: number) => (
                  <div key={index} className={`cursor-pointer rounded-[5px]  ${selectedAvatar === avatar.avatarUrl && "active"}`} onClick={() => handleAvatarClick(avatar.avatarUrl)}>
                    <Image unoptimized src={getImageUrlOfS3(avatar.avatarUrl)} alt={`Avatar ${index + 1}`} width={74} height={68} className="border border-[#FFE2CE] w-[74px] h-[68px] object-cover rounded-[5px]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <h3 className="md:w-[15%] lg:w-[10%] mx-[20px] 2xl:mx-[45px] flex justify-center items-center text-[#6B6B6B] text-sm italic">
          —— Or ——
          </h3>
          <div className="md:w-[40%] ">
            <h3 className="text-[#6B6B6B] text-sm mb-2">Create Your Own</h3>
            <div className="flex items-center gap-[21px]">
              {clickAvatar ? (
                <Image src={clickAvatar} alt="" width={128} height={128} className="max-w-[169px] max-h-[158px] h-full w-full object-cover rounded-[5px]" />
              ) : (
                <div className="w-[169px] h-[158px] relative rounded-[5px] border border-[#E87223] bg-[#FFF1E8]">
                  <input required={myOwnImage === null} type="image" src="" alt="" className="absolute top-0 left-0 h-full w-full opacity-0 camera-image" style={{ width: 169, height: 158 }} />
                  <div className="absolute inset-0 grid place-items-center" onClick={handleInstructionModal}>
                    <CameraIcon />
                  </div>
                </div>
              )}
              <div className="flex flex-col">
                <button className="xl:min-w-[145px] text-xs text-[#E87223] bg-white px-4 py-[7px] mb-[10px] rounded-[3px] border border-[#E87223]" onClick={handleInstructionModal}>
                  Open Camera
                </button>
                <label className="xl:min-w-[145px] font-inter h-[32px] !text-xs bg-[#E87223] !text-white px-4 py-[8px] rounded-[3px] cursor-pointer text-center">
                  Browse Gallery
                  <input required={avatarId === null} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={openInstruction} onRequestClose={closeInstructionModal} contentLabel="Open Camera" className="modal p-5 md:p-10 bg-white w-[90%] max-w-[677px] max-h-[90vh] rounded-[20px] overflow-auto overflo-custom " overlayClassName="z-[10] w-full h-full fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="grid md:grid-cols-2 gap-[34px] items-center ">
          <div>
            <Image src={instructionimg} alt="" className="rounded-[5px] w-full" />
          </div>
          <div>
            <h2 className="section-title !text-[28px] mb-2">Selecting an image</h2>
            <ul className="instructions-list mb-4">
              <li>
                <h3>Front facing</h3>
              </li>
              <li>
                <h3>Centered</h3>
              </li>
              <li>
                <h3>Neutral expression, closed mouth</h3>
              </li>
              <li>
                <h3>Good lighting</h3>
              </li>
              <li>
                <h3>Recommended min size : 512x512 px</h3>
              </li>
              <li>
                <h3>No face obstructions</h3>
              </li>
            </ul>
            <button onClick={handleCameraClick} className="text-sm bg-[#E87223] text-white px-4 py-[10px] rounded">
              Okay, I understand
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCropping} onRequestClose={() => setIsCropping(false)} contentLabel="Open Camera" className="modal p-5 md:p-10 bg-white w-[90%] max-w-[900px] max-h-[90vh] rounded-xl overflow-auto overflo-custom " overlayClassName="z-[10] w-full h-full fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center  ">
        <div className="relative w-full h-64">
          <Cropper image={clickAvatar!} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
        </div>
        <button className="mt-4 bg-[#E87223] text-white px-4 py-2 rounded" onClick={handleCropSave}>
          Save
        </button>
        <button className="ml-3 mt-2 bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setIsCropping(false)}>
          Cancel
        </button>
      </Modal>

      <Modal isOpen={isCameraOpen} onRequestClose={() => setIsCameraOpen(false)} contentLabel="Open Camera" className="modal p-5 md:p-10 bg-white w-[90%] max-w-[900px] max-h-[90vh] rounded-xl overflow-auto overflo-custom " overlayClassName="w-full h-full z-[10] fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <video ref={videoRef} className="w-full h-64 bg-black" autoPlay />
        <canvas ref={canvasRef} className="hidden" width={640} height={480}></canvas>
        <button className="mt-4 bg-[#E87223] text-white px-4 py-2 rounded" onClick={handleTakePicture}>
          Take Picture
        </button>
        <button className="ml-3 mt-2 bg-gray-500 text-white px-4 py-2 rounded" onClick={() => {
          setIsCameraOpen(false);
          if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
          }
        }}>
          Cancel
        </button>
      </Modal>
    </div>
  );
};

export default AvatarSelection;