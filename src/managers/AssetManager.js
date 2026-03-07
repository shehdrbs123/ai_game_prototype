import { BaseManager } from '../core/BaseManager.js';

/**
 * AssetManager: 3D 모델(FBX), 텍스처, 오디오 등 에셋의 로딩 및 캐싱을 담당합니다.
 * C# Porting: Unity의 Addressables 또는 Resources 시스템으로 대응됩니다.
 */
export class AssetManager extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        /** @private @type {any} Three.js FBXLoader instance */
        this.loader = null;
        
        /** @private @type {Map<string, any>} 원본 모델 캐시 */
        this.models = new Map();
        
        /** @private @type {Map<string, any>} 애니메이션 클립 캐시 */
        this.animations = new Map();
        
        /** @private @type {number} 로딩 진행률 (0~100) */
        this.loadProgress = 0;
    }

    /**
     * 시스템 초기화
     * 생성자에서 로더를 만들지 않고, 초기화 단계에서 안전하게 생성합니다.
     */
    init() {
        super.init();
        this.ensureLoader();
        console.log('AssetManager initialized.');
    }

    /**
     * FBXLoader 인스턴스가 있는지 확인하고 없으면 생성합니다.
     * @private
     */
    ensureLoader() {
        if (this.loader) return true;

        if (window.THREE && window.THREE.FBXLoader) {
            this.loader = new window.THREE.FBXLoader();
            return true;
        } 
        
        // 만약 THREE 내부에 없고 글로벌 스코프에 따로 정의된 경우 대응
        if (window.FBXLoader) {
            this.loader = new window.FBXLoader();
            return true;
        }

        console.warn('AssetManager: FBXLoader not found yet. It might still be loading.');
        return false;
    }

    /**
     * 모델 파일을 비동기로 로드합니다.
     * @param {string} name - 에셋 식별 이름
     * @param {string} url - 모델 파일 경로
     * @returns {Promise<any>}
     */
    async loadModel(name, url) {
        if (this.models.has(name)) {
            return this.models.get(name);
        }

        return new Promise((resolve, reject) => {
            if (!this.ensureLoader()) {
                reject(new Error('THREE.FBXLoader is not available. Check if script is loaded properly.'));
                return;
            }

            this.loader.load(url, (object) => {
                // 모델 기본 설정 (예: 그림자)
                object.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.models.set(name, object);
                
                // 모델에 애니메이션이 포함되어 있다면 따로 저장
                if (object.animations && object.animations.length > 0) {
                    this.animations.set(name, object.animations);
                }

                // 로딩 완료 이벤트 발송
                this.events.emit('ASSET_LOADED', { name, type: 'model' });
                
                resolve(object);
            }, (xhr) => {
                if (xhr.lengthComputable) {
                    this.loadProgress = (xhr.loaded / xhr.total) * 100;
                    this.events.emit('ASSET_PROGRESS', { name, progress: this.loadProgress });
                }
            }, (error) => {
                console.error(`Failed to load model: ${url}`, error);
                this.events.emit('ASSET_LOAD_ERROR', { name, error });
                reject(error);
            });
        });
    }

    /**
     * 캐시된 모델의 복사본(Instance)을 생성합니다.
     * @param {string} name - 에셋 식별 이름
     * @returns {any|null}
     */
    instantiate(name) {
        const original = this.models.get(name);
        if (!original) {
            console.warn(`AssetManager: Model '${name}' not found in cache.`);
            return null;
        }

        // SkeletonUtils 또는 기본 복제 사용
        const THREE = window.THREE;
        const instance = THREE.SkeletonUtils ? 
            THREE.SkeletonUtils.clone(original) : 
            original.clone();
        
        return instance;
    }

    /**
     * 특정 모델의 애니메이션 리스트를 가져옵니다.
     * @param {string} name 
     * @returns {Array<any>}
     */
    getAnimations(name) {
        return this.animations.get(name) || [];
    }

    /**
     * 메모리 해제
     */
    destroy() {
        this.models.clear();
        this.animations.clear();
        super.destroy();
    }
}
