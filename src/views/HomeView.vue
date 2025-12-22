<template>
  <div>
    <span class="br-line"></span>
    <HeroSection @open-inject-modal="openInjectModal" @open-claim-reward-modal="openClaimRewardModal" @open-share-friend-modal="openShareFriendModal" @open-friends-contribution-modal="openFriendsContributionModal" />
    <!-- <FeatureSection /> -->
    <HowToUseSection />
    <!-- <BenefitSection /> -->
    <!-- <PricingSection /> -->
    <!-- <CTASection /> -->
    <TestimonialSection />
    <!-- <FAQSection /> -->
    

    <transition name="modal">
      <InjectPoolModal 
        v-if="isInjectModalVisible" 
        @close="closeInjectModal"
        @confirm="handleInjectionConfirm"
      />
    </transition>

    <transition name="modal">
      <ConfirmReferrerModal
        v-if="isConfirmReferrerModalVisible"
        @close="closeConfirmReferrerModal"
        @confirm="handleReferrerConfirm"
      />
    </transition>

    <transition name="modal">
        <ClaimRewardModal v-if="isClaimRewardModalVisible" @close="closeClaimRewardModal" />
    </transition>
    
    <transition name="modal">
      <ShareFriendModal 
        v-if="isShareFriendModalVisible" 
        :referral-link="referralLinkForModal"
        @close="closeShareFriendModal"
      />
    </transition>

    <transition name="modal">
      <FriendsContributionModal 
        v-if="isFriendsContributionModalVisible" 
        :referrer-address="referrerAddressForModal"
        @close="closeFriendsContributionModal"
      />
    </transition>

    <transition name="modal">
      <AlertModal 
        v-if="isAlertModalVisible" 
        :title="alertTitle"
        :message="alertMessage"
        @close="closeAlertModal"
      />
    </transition>
  </div>
</template>

<script>
import HeroSection from '../components/HeroSection.vue';
// import FeatureSection from '../components/FeatureSection.vue';
import BenefitSection from '../components/BenefitSection.vue';
import HowToUseSection from '../components/HowToUseSection.vue';
import FeatureSection from '../components/FeatureSection.vue';
import TestimonialSection from '../components/TestimonialSection.vue';
import PricingSection from '../components/PricingSection.vue';
import FAQSection from '../components/FAQSection.vue';
// import CTASection from '../components/CTASection.vue';
import InjectPoolModal from '../components/InjectPoolModal.vue';
import ConfirmReferrerModal from '../components/ConfirmReferrerModal.vue';
import ClaimRewardModal from '../components/ClaimRewardModal.vue'; // <-- Import the new modal
import ShareFriendModal from '../components/ShareFriendModal.vue';
import FriendsContributionModal from '../components/FriendsContributionModal.vue';
import AlertModal from '../components/AlertModal.vue';
import {
  walletState
} from '../services/wallet';
import {
  stakeWithInviter,
  getReferrer,
  isReferrerValid,
  getMaxStakeAmount,
  getOskBalance,
  checkAllClaimableRewards
} from '../services/contracts';
import {
  showToast
} from '../services/notification';
import {
    onMounted,
    watch
} from 'vue';
import { t } from '@/i18n';


export default {
  name: 'HomeView',
  components: {
    HeroSection,
    // FeatureSection,
    BenefitSection,
    HowToUseSection,
    // PricingSection,
    TestimonialSection,
    FAQSection,
    InjectPoolModal,
    ConfirmReferrerModal,
    // CTASection,
    ClaimRewardModal,
    ShareFriendModal,
    FriendsContributionModal,
    AlertModal,
  },
  data() {
    return {
      isInjectModalVisible: false,
      isConfirmReferrerModalVisible: false,
      isClaimRewardModalVisible: false, // <-- Add state for the new modal
      isShareFriendModalVisible: false,
      isFriendsContributionModalVisible: false,
      isAlertModalVisible: false,
      alertTitle: '',
      alertMessage: '',
      referralLinkForModal: '',
      referrerAddressForModal: '',
      injectionData: null, // To store data from the first modal
      isStaking: false, // To lock UI during transaction
      walletState: walletState,
    };
  },
  methods: {
    openInjectModal() {
      this.isInjectModalVisible = true;
    },
    closeInjectModal() {
      this.isInjectModalVisible = false;
    },
    openShareFriendModal(data) {
      this.referralLinkForModal = data.referralLink;
      this.referrerAddressForModal = data.referrerAddress || '';
      this.isShareFriendModalVisible = true;
    },
    closeShareFriendModal() {
      this.isShareFriendModalVisible = false;
    },
    openFriendsContributionModal(data) {
      this.referrerAddressForModal = data.referrerAddress || '';
      this.isFriendsContributionModalVisible = true;
    },
    closeFriendsContributionModal() {
      this.isFriendsContributionModalVisible = false;
    },
    closeAlertModal() {
      this.isAlertModalVisible = false;
    },
    openClaimRewardModal() {
      this.isClaimRewardModalVisible = true;
    },
    closeClaimRewardModal() {
      this.isClaimRewardModalVisible = false;
      // When the modal is closed, re-check for rewards to update the red dot
      checkAllClaimableRewards();
    },
    async handleInjectionConfirm(data) {
      console.log('Injection data received:', data);
      this.injectionData = data;
      this.isInjectModalVisible = false;

      // Decide the next step based on user status
      if (this.walletState.isNewUser) {
        this.isConfirmReferrerModalVisible = true;
      } else {
        // Old user flow: directly proceed to stake
        await this.executeStakeForOldUser();
      }
    },
    closeConfirmReferrerModal() {
      this.isConfirmReferrerModalVisible = false;
    },
    async handleReferrerConfirm(pendingReferrer) {
      console.log('Referrer confirmed by user:', pendingReferrer);
      this.isConfirmReferrerModalVisible = false;
      // New user flow: proceed to stake with validation
      await this.executeStakeForNewUser(pendingReferrer);
    },

    // --- Staking Execution Logic ---

    async executeStakeForNewUser(parentAddress) {
      if (this.isStaking) return;
      this.isStaking = true;
      console.log(`[指挥官] 开始为新用户执行质押流程...`);
      showToast(t("toast.stakingRequest"));

      // Final real-time balance check
      const realTimeBalance = await getOskBalance();
      const amountToStake = this.injectionData.amount;
      if (parseFloat(realTimeBalance) < parseFloat(amountToStake)) {
        showToast(t('toast.insufficientBalance', { balance: parseFloat(realTimeBalance).toFixed(4) }));
        this.isStaking = false;
        return;
      }

      // Final on-chain validation for the parent address
      console.log(`[指挥官] 对新用户的推荐人地址进行最终链上校验: ${parentAddress}`);
      const isParentValid = await isReferrerValid(parentAddress);
      if (!isParentValid) {
        console.error(`[指挥官] 推荐人地址校验失败: ${parentAddress}`);
        showToast(t("toast.invalidReferrer"));
        this.isStaking = false;
        return;
      }
      console.log(`[指挥官] 推荐人地址校验成功`);

      const { amount, duration } = this.injectionData;

      // Diagnostic log for max stake amount - REMOVED for optimization
      // const maxAmount = await getMaxStakeAmount();
      // console.log(`[指挥官] 诊断信息: 当前允许的最大质押额: ${maxAmount} OSK, 用户尝试质押: ${amount} OSK`);

      console.log(`[指挥官] 即将调用 stakeWithInviter, 参数为:`, { amount, stakeIndex: duration, parentAddress });
      const result = await stakeWithInviter(amount, duration, parentAddress);

      // Check if there is debug info from stakeWithInviter
      /*
      if (this.walletState.debugInfo) {
          this.alertTitle = this.walletState.debugInfo.title;
          this.alertMessage = this.walletState.debugInfo.message;
          this.isAlertModalVisible = true;
          // Clear it so it doesn't persist
          delete this.walletState.debugInfo;
      }
      */

      if (result.success) {
        console.log("[指挥官] 质押交易成功");
        showToast(t("toast.stakeSuccessRefresh"));
        // Delay reload a bit more if debug was shown?
        setTimeout(() => window.location.reload(), 2000);
      } else {
        if (result.cancelled) {
             console.log("[指挥官] 用户取消交易");
             this.isStaking = false;
             return;
        }
        console.error("[指挥官] 质押交易失败");
        // Only overwrite alert if it wasn't the debug info, OR append to it?
        // User wants to see the calculation values.
        // If it failed, the debug info is still useful.
        // Let's append failure message if debug info exists.
        
        /*
        if (this.isAlertModalVisible) {
            this.alertTitle = t("toast.stakeFailed");
            const failMsg = result.rawError ? `${result.error}\n\n[Raw Error]: ${result.rawError}` : (result.error || t("toast.stakeFailedRetry"));
            this.alertMessage = this.alertMessage + "\n\n----------------\n\n[Transaction Failed]:\n" + failMsg;
        } else {
            this.alertTitle = t("toast.stakeFailed");
            this.alertMessage = result.rawError ? `${result.error}\n\n[Raw Error]: ${result.rawError}` : (result.error || t("toast.stakeFailedRetry"));
            this.isAlertModalVisible = true;
        }
        */
        showToast(result.error || t("toast.stakeFailed"));
      }
      this.isStaking = false;
    },

    async executeStakeForOldUser() {
      if (this.isStaking) return;
      this.isStaking = true;
      console.log("[指挥官] 开始为老用户执行质押流程...");
      // showToast("正在获取推荐人信息并质押...");

      // Final real-time balance check
      const realTimeBalance = await getOskBalance();
      const amountToStake = this.injectionData.amount;
      if (parseFloat(realTimeBalance) < parseFloat(amountToStake)) {
        showToast(t('toast.insufficientBalance', { balance: parseFloat(realTimeBalance).toFixed(4) }));
        this.isStaking = false;
        return;
      }

      console.log("[指挥官] 开始从合约获取已绑定的推荐人地址...");
      const parentAddress = await getReferrer();
      if (!parentAddress || parentAddress.startsWith('0x000')) {
        console.error("[指挥官] 获取老用户的推荐人地址失败");
        showToast(t("toast.fetchReferrerFailed"));
        this.isStaking = false;
        return;
      }
      console.log(`[指挥官] 成功获取到老用户的推荐人地址: ${parentAddress}`);
      
      const { amount, duration } = this.injectionData;

      // Diagnostic log for max stake amount - REMOVED for optimization
      // const maxAmount = await getMaxStakeAmount();
      // console.log(`[指挥官] 诊断信息: 当前允许的最大质押额: ${maxAmount} OSK, 用户尝试质押: ${amount} OSK`);

      console.log(`[指挥官] 即将调用 stakeWithInviter, 参数为:`, { amount, stakeIndex: duration, parentAddress });
      const result = await stakeWithInviter(amount, duration, parentAddress);
      
      // Check if there is debug info from stakeWithInviter
      /*
      if (this.walletState.debugInfo) {
          this.alertTitle = this.walletState.debugInfo.title;
          this.alertMessage = this.walletState.debugInfo.message;
          this.isAlertModalVisible = true;
          // Clear it so it doesn't persist
          delete this.walletState.debugInfo;
      }
      */
      
      if (result.success) {
        console.log("[指挥官] 质押交易成功");
        showToast(t("toast.stakeSuccessRefresh"));
        setTimeout(() => window.location.reload(), 2000);
      } else {
        if (result.cancelled) {
             console.log("[指挥官] 用户取消交易");
             this.isStaking = false;
             return;
        }
        console.error("[指挥官] 质押交易失败");
        
        /*
        if (this.isAlertModalVisible) {
            this.alertTitle = t("toast.stakeFailed"); // Update title to indicate failure
            const failMsg = result.rawError ? `${result.error}\n\n[Raw Error]: ${result.rawError}` : (result.error || t("toast.stakeFailedRetry"));
            this.alertMessage = this.alertMessage + "\n\n----------------\n\n[Transaction Failed]:\n" + failMsg;
        } else {
            this.alertTitle = t("toast.stakeFailed");
            this.alertMessage = result.rawError ? `${result.error}\n\n[Raw Error]: ${result.rawError}` : (result.error || t("toast.stakeFailedRetry"));
            this.isAlertModalVisible = true;
        }
        */
        showToast(result.error || t("toast.stakeFailed"));
      }
      this.isStaking = false;
    }
  },
  mounted() {
    // autoConnectWallet(); // This line is removed as per the new_code, as autoConnectWallet is no longer imported.
  },
  setup() {
    // Watch for authentication changes to update the red dot indicator
    watch(() => [walletState.isAuthenticated, walletState.contractsInitialized], ([isAuth, contractsReady]) => {
      if (isAuth && contractsReady) {
        checkAllClaimableRewards();
      }
    });

    // This is needed for the template to access walletState
    return {
      walletState,
      t, // Expose t function to the template
    };
  }
};
</script>
