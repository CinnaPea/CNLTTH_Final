Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  # get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      get "health", to: "health#index"
      post "auth/login", to: "auth#login"
      post "auth/signup", to: "auth#signup"
      resources :vai_tro, only: [:index]
      resources :nhat_ky, only: [:index, :show]
      resources :nguoi_dung, only: [:index, :show, :create, :update, :destroy]
      resources :mon_thi, only: [:index, :show, :create, :update, :destroy]
      resources :sinh_vien, only: [:index, :show, :create, :update, :destroy]
      resources :phong_thi, only: [:index, :show, :create, :update, :destroy] 
      resources :ky_thi, only: [:index, :show, :create, :update, :destroy] do
        member do
          patch :publish
          patch :close
        end
      end
      resources :dang_ky_thi, only: [:index, :show, :create, :update, :destroy] do
        member do
          patch :cancel
        end  
      end
      resources :phan_phong, only: [:index, :show, :create, :destroy]
      resources :xep_cho, only: [:index, :show, :create, :destroy]
      resources :diem_danh, only: [:index, :show, :create, :update]

      post "ky_thi/:id/auto_phan_phong",
          to: "workflow#auto_phan_phong",
          as: :ky_thi_auto_phan_phong

      post "ky_thi/:id/auto_xep_cho",
          to: "workflow#auto_xep_cho",
          as: :ky_thi_auto_xep_cho

      post "ky_thi/:id/open_diem_danh",
          to: "workflow#open_diem_danh",
          as: :ky_thi_open_diem_danh
    end
  end    
  # Defines the root path route ("/")
  # root "posts#index"
end
