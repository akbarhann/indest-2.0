import pytest
from sqlmodel import SQLModel, Session, create_engine
from decimal import Decimal
from backend.models import Village, Health, Education, Economy, Infrastructure, Digital, Disaster
from backend.services.analytics import ScoringAlgorithm, ClusteringService

# Setup in-memory DB
@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_health_radar(session: Session):
    # Setup Data
    v = Village(id="1", name="Village A", district="Dist A", latitude=0, longitude=0)
    # High Supply (Safe)
    h = Health(village_id="1", doctors=2, midwives=5, puskesmas=1, 
               malnutrition_cases=0, dengue_cases=0, malaria_cases=0)
    # Supply = 2*3 + 5*1 + 1*5 = 6+5+5 = 16
    # Demand = 0
    
    session.add(v)
    session.add(h)
    session.commit()
    session.refresh(v)
    
    result = ScoringAlgorithm.calculate_health_radar(v)
    assert result['status'] == "Safe"
    assert result['supply'] == 16
    assert result['demand'] == 0

    # High Demand (Risk)
    h.dengue_cases = 20
    session.add(h)
    session.commit()
    session.refresh(v)
    
    result = ScoringAlgorithm.calculate_health_radar(v)
    assert result['status'] == "High Risk"
    assert result['demand'] == 20

def test_education_funnel(session: Session):
    v = Village(id="2", name="Village B", district="Dist A", latitude=0, longitude=0)
    # Ratios
    e = Education(village_id="2", sd_counts=100, smp_counts=10, sma_counts=5, smk_counts=0, universities=0)
    # Ratio = (10+5)/100 = 0.15 -> Risk (< 0.2)
    
    session.add(v)
    session.add(e)
    session.commit()
    session.refresh(v)
    
    result = ScoringAlgorithm.calculate_education_funnel(v)
    assert result['status'] == "Dropout Risk Zone"
    assert result['ratio'] == 0.15

    # Stable
    e.smp_counts = 20
    e.sma_counts = 10
    # Ratio = 30/100 = 0.3
    session.add(e)
    session.commit()
    session.refresh(v)
    
    result = ScoringAlgorithm.calculate_education_funnel(v)
    assert result['status'] == "Stable"

def test_independence_index(session: Session):
    v = Village(id="3", name="Village C", district="Dist A", latitude=0, longitude=0)
    d = Digital(village_id="3", signal_strength="Sinyal Kuat", internet_availability="Ada", bts_count=5)
    i = Infrastructure(village_id="3", electricity="PLN", water_source="Leding")
    ec = Economy(village_id="3", primary_income="X", markets=5, banks=2, cooperatives=5, bumdes=2)
    # Digital: Sig(100) + Net(100) + BTS(100) / 3 = 100
    # Living: Water(100) + Elec(100) / 2 = 100
    # Economy: Mkt(100) + Bank(100) + Coop(100) + Bumdes(100) / 4 = 100
    # Total = 100 -> Maju
    
    session.add_all([v, d, i, ec])
    session.commit()
    session.refresh(v)
    
    result = ScoringAlgorithm.calculate_independence_index(v)
    assert result['grade'] == "Maju"
    assert result['score'] == 100.0

def test_clustering_service(session: Session):
    # Create multiple villages
    villages = []
    for i in range(10):
        v = Village(id=f"10{i}", name=f"V{i}", district="D", latitude=0, longitude=0)
        e = Economy(village_id=f"10{i}", primary_income="Pertanian" if i < 5 else "Industry", markets=i, banks=0, cooperatives=0, bumdes=0, industries=i)
        d = Digital(village_id=f"10{i}", signal_strength="Sinyal Kuat", internet_availability="Ada", bts_count=1)
        v.topography = "Dataran Rendah"
        
        # Link explicitly
        v.economy = e
        v.digital = d
        villages.append(v)
    
    # Needs a session/engine? The service takes list[Village] but those objects need valid relationship access. 
    # Since we set relationships on objects, it should be fine even without session commit if objects are fully formed, 
    # but strictly relationships are lazy loaded if fetched from DB. 
    # Here we constructed them manually. SQLModel relationships might need manual setting if not attached to session.
    # Let's verify manual linking works for attribute access.
    
    service = ClusteringService(n_clusters=2)
    # Mocking train
    labels = service.train_model(villages)
    assert len(labels) == 10
    
    # Predict
    persona = service.predict_persona(villages[0])
    assert isinstance(persona, str)
