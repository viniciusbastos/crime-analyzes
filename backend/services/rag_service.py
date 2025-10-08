import chromadb
import ollama
import os
from typing import List, Dict, Any
import json
from datetime import datetime
from models.models import db, Crime
from services.crime_data_service import CrimeDataService
from sqlalchemy import func, extract


class RAGService:
    """Retrieval-Augmented Generation service using ChromaDB and sentence transformers"""

    def __init__(self, collection_name: str = "crime_knowledge", persist_directory: str = "./chroma_db"):
        """Initialize RAG service with ChromaDB and sentence transformer model"""
        self.collection_name = collection_name
        self.persist_directory = persist_directory

        # Initialize Ollama embedding model
        self.embedding_model = 'mxbai-embed-large:latest'

        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(path=persist_directory)

        # Get or create collection
        try:
            self.collection = self.chroma_client.get_collection(name=collection_name)
            # Check if collection needs reinitialization (empty or old version)
            if self.collection.count() == 0:
                print("Initializing empty knowledge base...")
                self._initialize_knowledge_base()
            else:
                print(f"Using existing knowledge base with {self.collection.count()} documents")
        except Exception:
            self.collection = self.chroma_client.create_collection(name=collection_name)
            self._initialize_knowledge_base()

        # Initialize with basic crime knowledge if collection is empty
        if self.collection.count() == 0:
            self._initialize_knowledge_base()

    def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts using Ollama"""
        embeddings = []
        for text in texts:
            response = ollama.embeddings(model=self.embedding_model, prompt=text)
            embeddings.append(response['embedding'])
        return embeddings

    def _initialize_knowledge_base(self):
        """Initialize the knowledge base with comprehensive crime analysis information from database"""
        documents = []

        try:
            # Get crime data service instance
            crime_service = CrimeDataService()

            # Get overall statistics from database
            total_crimes = Crime.query.count()

            if total_crimes > 0:
                # Get crime types distribution
                crime_types = db.session.query(
                    Crime.crime_type,
                    func.count(Crime.id).label('count')
                ).group_by(Crime.crime_type).order_by(func.count(Crime.id).desc()).all()

                # Get city distribution
                cities = db.session.query(
                    Crime.city,
                    func.count(Crime.id).label('count')
                ).filter(Crime.city.isnot(None)).group_by(Crime.city).order_by(func.count(Crime.id).desc()).limit(20).all()

                # Get temporal patterns
                hourly_pattern = db.session.query(
                    extract('hour', Crime.date_time).label('hour'),
                    func.count(Crime.id).label('count')
                ).group_by(extract('hour', Crime.date_time)).order_by(extract('hour', Crime.date_time)).all()

                monthly_pattern = db.session.query(
                    extract('month', Crime.date_time).label('month'),
                    func.count(Crime.id).label('count')
                ).group_by(extract('month', Crime.date_time)).order_by(extract('month', Crime.date_time)).all()

                # Get yearly data
                yearly_data = db.session.query(
                    extract('year', Crime.date_time).label('year'),
                    func.count(Crime.id).label('count')
                ).group_by(extract('year', Crime.date_time)).order_by(extract('year', Crime.date_time)).all()

                # Create dynamic documents based on actual data
                documents.extend(self._create_general_crime_documents())

                # Add database-specific documents
                documents.extend(self._create_database_documents(
                    total_crimes, crime_types, cities, hourly_pattern, monthly_pattern, yearly_data
                ))

            else:
                # Fallback to general knowledge if no data
                documents.extend(self._create_general_crime_documents())

        except Exception as e:
            print(f"Error loading database knowledge: {e}")
            # Fallback to general knowledge
            documents.extend(self._create_general_crime_documents())

        # Create embeddings and add to collection
        embeddings = self._get_embeddings(documents)

        # Add documents to ChromaDB
        ids = [f"doc_{i}" for i in range(len(documents))]
        metadatas = [{"category": "crime_analysis", "source": "database_knowledge", "created_at": datetime.utcnow().isoformat()} for _ in documents]

        self.collection.add(
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

        print(f"Initialized knowledge base with {len(documents)} documents")

    def _create_general_crime_documents(self) -> List[str]:
        """Create general crime analysis knowledge documents"""
        return [
            # Crime analysis concepts
            "Crime analysis involves examining crime patterns, trends, and statistics to understand criminal behavior and inform law enforcement strategies.",
            "Temporal analysis studies when crimes occur, including patterns by hour, day of week, month, and season.",
            "Spatial analysis examines where crimes happen, identifying hotspots, clusters, and geographic patterns.",
            "Crime hotspots are areas with consistently high crime rates that may require increased police presence.",
            "Crime trends show changes in crime rates over time, which can be influenced by various social, economic, and environmental factors.",
            "Crime forecasting uses historical data and statistical models to predict future crime patterns.",
            "Crime mapping visualizes crime locations and patterns using geographic information systems (GIS).",
            "Crime prevention strategies include community policing, environmental design, and targeted interventions in high-risk areas.",

            # Crime types and categories
            "Violent crimes include homicide, assault, robbery, and sexual assault, typically involving physical harm or threat of harm.",
            "Property crimes include burglary, theft, motor vehicle theft, and arson, involving damage to or theft of property.",
            "Drug-related crimes involve illegal possession, distribution, or manufacture of controlled substances.",
            "White-collar crimes include fraud, embezzlement, and money laundering, typically committed by professionals in business settings.",
            "Cybercrimes involve computer systems and networks, including hacking, identity theft, and online fraud.",

            # Analysis methods
            "Statistical analysis of crime data helps identify patterns and correlations between different variables.",
            "Comparative analysis examines crime rates between different time periods, locations, or demographic groups.",
            "Risk assessment evaluates the likelihood of future crimes in specific areas or by specific individuals.",
            "Crime intelligence combines various data sources to provide actionable insights for law enforcement.",

            # Data considerations
            "Crime data quality is crucial for accurate analysis, requiring proper data collection, validation, and cleaning.",
            "Underreporting of crimes can significantly affect statistical analysis and trend identification.",
            "Demographic factors such as age, gender, socioeconomic status, and ethnicity can influence crime patterns.",
            "Seasonal variations in crime rates may be influenced by weather, holidays, and school schedules.",

            # Advanced spatial analysis and clustering knowledge
            "DBSCAN (Density-Based Spatial Clustering of Applications with Noise) is a clustering algorithm that groups together points that are closely packed together while marking outliers as noise.",
            "DBSCAN is particularly effective for crime hotspot detection because it can identify arbitrarily shaped clusters and is robust to noise.",
            "DBSCAN requires two parameters: eps (maximum distance between two samples) and min_samples (minimum number of points required to form a dense region).",
            "K-means clustering partitions data into k clusters where each observation belongs to the cluster with the nearest mean (centroid).",
            "K-means is useful for crime analysis when you want to divide an area into a predetermined number of crime zones or risk levels.",
            "K-means requires specifying the number of clusters (k) in advance, unlike DBSCAN which determines clusters automatically.",
            "For crime hotspot analysis, DBSCAN is often preferred over k-means because it can identify irregular-shaped clusters and doesn't require pre-specifying cluster count.",
            "Kernel Density Estimation (KDE) can be used to create smooth density surfaces from discrete crime points, helping visualize crime concentration areas.",
            "Hotspot analysis combines spatial statistics with clustering algorithms to identify areas with statistically significant high crime concentrations.",
            "Ripley's K-function is a statistical tool used to analyze spatial patterns and determine if crimes are clustered, dispersed, or randomly distributed.",
            "Spatial autocorrelation measures like Moran's I can quantify how similar crime rates are between neighboring areas.",
            "Crime prediction models often use spatial clustering results combined with temporal patterns to forecast where crimes are likely to occur.",
            "Geographic profiling uses spatial analysis of crime locations to predict offender home bases and activity spaces.",
            "Crime density mapping helps law enforcement allocate resources more effectively by identifying areas needing increased patrol presence.",
            "Spatial analysis of crime data can reveal environmental factors that contribute to criminal activity, such as poor lighting or lack of surveillance.",
            "Multi-scale clustering analysis examines crime patterns at different spatial scales (neighborhood, city, regional) to understand hierarchical crime structures.",

            # Law enforcement strategies
            "Community policing emphasizes building relationships between police and community members.",
            "Hot spot policing focuses resources on areas with high crime concentrations.",
            "Problem-oriented policing identifies and addresses the underlying causes of crime problems.",
            "Intelligence-led policing uses crime analysis to guide resource allocation and investigative priorities.",
            "Predictive policing uses data analysis to anticipate where crimes are likely to occur.",
            "Restorative justice focuses on repairing harm caused by crime rather than just punishing offenders."
        ]

    def _create_database_documents(self, total_crimes: int, crime_types: List, cities: List,
                                 hourly_pattern: List, monthly_pattern: List, yearly_data: List) -> List[str]:
        """Create documents based on actual database statistics and patterns"""
        documents = []

        # Overall statistics
        documents.append(f"The database contains {total_crimes} total crime records for analysis.")

        # Crime types
        if crime_types:
            top_crime_types = crime_types[:10]
            documents.append(f"The most common crime types in the database are: {', '.join([f'{ct[0]} ({ct[1]} incidents)' for ct in top_crime_types])}.")
            documents.append(f"The most prevalent crime type is {crime_types[0][0]} with {crime_types[0][1]} recorded incidents.")

        # Geographic distribution
        if cities:
            top_cities = cities[:10]
            documents.append(f"The cities with the highest crime counts are: {', '.join([f'{city[0]} ({city[1]} crimes)' for city in top_cities])}.")
            documents.append(f"{cities[0][0]} has the highest crime count with {cities[0][1]} recorded incidents.")

        # Temporal patterns
        if hourly_pattern:
            peak_hour = max(hourly_pattern, key=lambda x: x[1])
            low_hour = min(hourly_pattern, key=lambda x: x[1])
            documents.append(f"Crimes peak at {int(peak_hour[0]):02d}:00 hours with {peak_hour[1]} incidents, and are lowest at {int(low_hour[0]):02d}:00 hours with {low_hour[1]} incidents.")

        if monthly_pattern:
            peak_month = max(monthly_pattern, key=lambda x: x[1])
            low_month = min(monthly_pattern, key=lambda x: x[1])
            month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December']
            documents.append(f"Crimes are most frequent in {month_names[int(peak_month[0])-1]} with {peak_month[1]} incidents, and least frequent in {month_names[int(low_month[0])-1]} with {low_month[1]} incidents.")

        if yearly_data:
            documents.append(f"The database covers crime data from {int(yearly_data[0][0])} to {int(yearly_data[-1][0])}.")
            if len(yearly_data) > 1:
                latest_year = yearly_data[-1]
                previous_year = yearly_data[-2]
                change = latest_year[1] - previous_year[1]
                change_percent = (change / previous_year[1]) * 100 if previous_year[1] > 0 else 0
                trend = "increased" if change > 0 else "decreased"
                documents.append(f"In {int(latest_year[0])}, there were {latest_year[1]} crimes, {trend} by {abs(change)} incidents ({abs(change_percent):.1f}%) compared to {int(previous_year[0])}.")

        # Crime rate calculations
        if cities and total_crimes > 0:
            avg_crimes_per_city = total_crimes / len(cities)
            documents.append(f"On average, each city in the database has {avg_crimes_per_city:.1f} recorded crimes.")

        # Data quality insights
        documents.append("This knowledge base is dynamically generated from actual crime data in the database, providing current and accurate information for analysis.")

        return documents

    def reinitialize_knowledge_base(self):
        """Force reinitialization of the knowledge base with updated content"""
        try:
            # Delete existing collection
            self.chroma_client.delete_collection(name=self.collection_name)
            print(f"Deleted existing collection: {self.collection_name}")

            # Create new collection
            self.collection = self.chroma_client.create_collection(name=self.collection_name)
            print(f"Created new collection: {self.collection_name}")

            # Initialize with new knowledge
            self._initialize_knowledge_base()
            print("Knowledge base reinitialized successfully")

        except Exception as e:
            print(f"Error reinitializing knowledge base: {str(e)}")
            # Fallback: try to create collection if it doesn't exist
            try:
                self.collection = self.chroma_client.create_collection(name=self.collection_name)
                self._initialize_knowledge_base()
            except Exception as e2:
                print(f"Fallback initialization failed: {str(e2)}")

    def retrieve_relevant_documents(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant documents for a given query"""
        try:
            # Encode query
            query_embedding = self._get_embeddings([query])[0]

            # Search collection
            results = self.collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=n_results,
                include=['documents', 'metadatas', 'distances']
            )

            # Format results
            relevant_docs = []
            if results['documents'] and len(results['documents']) > 0:
                for i, doc in enumerate(results['documents'][0]):
                    distance = results['distances'][0][i] if results['distances'] else None
                    score = 1 - distance if distance is not None else 0

                    relevant_docs.append({
                        'content': doc,
                        'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                        'distance': distance,
                        'score': score
                    })

            return relevant_docs

        except Exception as e:
            print(f"Error retrieving documents: {str(e)}")
            return []

    def add_document(self, document: str, metadata: Dict[str, Any] = None) -> bool:
        """Add a new document to the knowledge base"""
        try:
            # Generate embedding
            embedding = self._get_embeddings([document])[0]

            # Generate unique ID
            doc_id = f"doc_{int(datetime.utcnow().timestamp() * 1000000)}"

            # Default metadata
            if metadata is None:
                metadata = {}

            metadata.update({
                "source": "user_added",
                "created_at": datetime.utcnow().isoformat()
            })

            # Add to collection
            self.collection.add(
                embeddings=[embedding.tolist()],
                documents=[document],
                metadatas=[metadata],
                ids=[doc_id]
            )

            return True

        except Exception as e:
            print(f"Error adding document: {str(e)}")
            return False

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base collection"""
        try:
            count = self.collection.count()
            return {
                "total_documents": count,
                "collection_name": self.collection_name,
                "embedding_model": self.embedding_model
            }
        except Exception as e:
            print(f"Error getting collection stats: {str(e)}")
            return {"error": str(e)}


# Global RAG service instance
rag_service = RAGService()