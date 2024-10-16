/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import Logo from "@/assets/images/logo.png";
import { useState } from "react";
import { NotificationIcon } from "@/utils/svgIcons";
import { usePathname } from "next/navigation";
import { MenuIcon, ToggleClose } from "@/utils/svgIcons";
import useSWR from "swr";
import { getUserInfo, getUserNotifications } from "@/services/user-service";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { signOut } from "next-auth/react";
import { getDbImageUrl } from "@/utils";


interface HeaderProps {
  notificationsCount: number;
  userImage: string | StaticImageData;
  toggleSidebar: () => void;
  isOpen: boolean;
}
const Header: React.FC<HeaderProps> = ({
  notificationsCount,
  userImage,
  toggleSidebar,
  isOpen,

}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showData, setShowData] = useState(false);
  const pathname = usePathname();
  const session = useSession()
  const { data, isLoading, mutate } = useSWR(`/user/${session.data?.user?.id}`, getUserInfo, { revalidateOnFocus: false })
  const { data: userNotification } = useSWR(`/user/${session.data?.user?.id}/notifications`, getUserNotifications)
  if (data?.data.success === false) return toast.error('Something went wrong');
  if (userNotification?.data.success === false) return toast.error('Something went fetching user notifications')
  const dataOfUser = data?.data.data;
  const pageNames: { [key: string]: string } = {
    "/home-page": "Home",
    "/my-projects": "My Projects",
    "/text-photo": "Text & Photo To Video",
    "/audio-photo": "Audio & Photo To Video",
    "/video-translation": "Video Generation And Translation",
    "/refer": "Refer",
    "/my-profile": "My Profile",
    "/plans": "Plans",
    // Add more paths as needed
  };

  const currentPageName = pageNames[pathname] || "Home";

  const handleDataShow = () => {
    setShowData(!showData);
  };
  const handleLinkClick = (path: string) => {
    // setActiveLink(path);
    setShowData(false);
  };


  return (
    <header className="flex justify-between items-center p-5  md:py-[23px] md:px-[30px] bg-white ">

      <div className="lg:min-w-[270px] ">
        <Link href="/">
          <Image
            src={Logo}
            alt=""
            height={100}
            width={200}
            className="max-w-[120px] md:max-w-[158px] "
          />
        </Link>
      </div>
      <div className="flex items-center justify-end lg:justify-between w-full ">
        <h1 className="hidden lg:block section-title">{currentPageName}</h1>

        <div className="flex items-center space-x-[15px] md:space-x-[30px] relative">
          <h3 className="hidden lg:block bg-[#FFEEE2] font-[500] text-xs text-[#3A2C23] border border-[#FFE2CE] px-6 py-[9px] rounded-full">
            Credits left
            <span className="text-[#E87223] ml-[10px]">{dataOfUser?.creditsLeft}</span>
          </h3>
          <div className="relative flex">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative focus:outline-none"
            >
              <span className="sr-only">View notifications</span>
              <NotificationIcon />
              {notificationsCount > 0 && (
                <span className="absolute top-0 right-[1px] inline-block w-[6px] h-[6px] text-[0] font-bold text-white bg-[#E87223] rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute top-[25px] right-0 mt-2 w-[200px] md:w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <ul className="py-1 text-sm text-gray-700 overflow-y-scroll">
                  {userNotification?.data?.data?.length > 0 ? (
                    userNotification!.data.data.map((notification: any, index: number) => {
                      const createdAt = new Date(notification.createdAt);
                      const isValidDate = !isNaN(createdAt.getTime());

                      return (
                        <li key={index} className="px-4 py-2 border-b">
                          {notification.title}
                          <br />
                          <span className="text-xs text-gray-500">
                            {isValidDate ? formatDistanceToNow(createdAt, { addSuffix: true }) : 'Invalid date'}
                          </span>
                        </li>
                      );
                    })
                  ) : (
                    <li className="px-4 py-2 text-gray-500">No notifications available</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className=" cursor-pointer " onClick={() => setShowData(!showData)}>
            <Image
              src={getDbImageUrl(dataOfUser?.profilePic || '')}
              alt="User Profile"
              width={34}
              height={34}
              className="rounded-full"
            />

          </div>
          {showData && (
            <div className=" text-right absolute z-[2] top-[40px] right-0 w-[150px] h-[100px] bg-white p-5 rounded-lg shadow-[0_4px_4px_0_rgba(0,0,0,0.08)] ">
              <Link href="/my-profile" onClick={() => handleLinkClick("/my-profile")}>
                <span className="text-[#3A2C23] text-base ">My Profile</span>
              </Link>
              <div>
                <button onClick={() => signOut({ redirectTo: '/login' })}>Log Out</button>
              </div>
            </div>
          )}
        </div>
        <button
          className="block lg:hidden z-[3] ml-[15px] "
          onClick={toggleSidebar}
        >
          {isOpen ? <ToggleClose /> : <MenuIcon />}
        </button>
      </div>
    </header>
  );
};

export default Header;