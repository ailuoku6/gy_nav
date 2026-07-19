import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';

export const isPasskeySupported = () => browserSupportsWebAuthn();

export const createPasskeyCredential = async (
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<RegistrationResponseJSON> => {
  if (!isPasskeySupported()) {
    throw new Error('PASSKEY_UNSUPPORTED');
  }

  return await startRegistration({ optionsJSON: options });
};

export const getPasskeyAssertion = async (
  options: PublicKeyCredentialRequestOptionsJSON
): Promise<AuthenticationResponseJSON> => {
  if (!isPasskeySupported()) {
    throw new Error('PASSKEY_UNSUPPORTED');
  }

  return await startAuthentication({ optionsJSON: options });
};

export const getPasskeyErrorMessage = (error: unknown) => {
  const errorName = error instanceof DOMException ? error.name : '';
  const message = error instanceof Error ? error.message : '';

  if (message === 'PASSKEY_UNSUPPORTED') {
    return '当前浏览器不支持 Passkey，请使用用户名密码登录';
  }

  if (errorName === 'NotAllowedError') {
    return '已取消 Passkey 验证';
  }

  if (message.includes('expired')) {
    return 'Passkey 验证已过期，请重新发起';
  }

  return 'Passkey 验证失败，请重试或使用用户名密码登录';
};
