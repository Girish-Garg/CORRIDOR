from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://corridor:corridor@db:5432/corridor"
    storage_endpoint: str = "minio:9000"
    storage_key: str = "corridor"
    storage_secret: str = "corridorminio"

    class Config:
        env_file = ".env"


settings = Settings()
