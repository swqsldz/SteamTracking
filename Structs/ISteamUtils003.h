class ISteamUtils003
{
public:
    virtual unknown_ret GetSecondsSinceAppActive() = 0;
    virtual unknown_ret GetSecondsSinceComputerActive() = 0;
    virtual unknown_ret GetConnectedUniverse() = 0;
    virtual unknown_ret GetServerRealTime() = 0;
    virtual unknown_ret GetIPCountry() = 0;
    virtual unknown_ret GetImageSize(int, unsigned int*, unsigned int*) = 0;
    virtual unknown_ret GetImageRGBA(int, unsigned char*, int) = 0;
    virtual unknown_ret GetCSERIPPort(unsigned int*, unsigned short*) = 0;
    virtual unknown_ret GetCurrentBatteryPower() = 0;
    virtual unknown_ret GetAppID() = 0;
    virtual unknown_ret SetOverlayNotificationPosition(ENotificationPosition) = 0;
    virtual unknown_ret IsAPICallCompleted(unsigned long long, bool*) = 0;
    virtual unknown_ret GetAPICallFailureReason(unsigned long long) = 0;
    virtual unknown_ret GetAPICallResult(unsigned long long, void*, int, int, bool*) = 0;
    virtual unknown_ret RunFrame() = 0;
    virtual unknown_ret GetIPCCallCount() = 0;
    virtual unknown_ret SetWarningMessageHook(void (*)(int, char const*)) = 0;
};
